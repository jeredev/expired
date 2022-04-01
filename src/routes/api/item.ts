import { supabase } from "$lib/supabase"
import type { RequestEvent } from "@sveltejs/kit/types/internal"

// export async function get(event: RequestEvent) {
//   return { 
//     status: 200,
//     body: 'Hello!'
//   }
// }

export async function del(event: RequestEvent) {
  try {
    if (event.locals.user.id) {
      const item = await event.request.formData()
      if (item.get('id')) {
        const { data, error } = await supabase
          .from('items')
          .delete()
          .match({ id: item.get('id') })
        if (error) {
          console.error('There was a problem:', error)
          return { 
            status: 400,
            body: JSON.stringify(error)
          }
        }
        if (data) {
          if (data[0] && data[0].imagePath) {
            const fromPath = `${event.locals.user.id}/${data[0].imagePath}`
            const { data: storageData, error: storageError } = await supabase
              .storage
              .from('expired')
              .remove([fromPath])
            if (storageError) {
              return { 
                status: 400,
                body: JSON.stringify(storageError)
              }
            }
          }
          return {
            status: 200,
            body: JSON.stringify(data)
          }
        }
      }
      else {
        return {
          status: 400,
          body: JSON.stringify({
            message: 'No id was passed.'
          })
        }
      }
    }
  }
  catch (e) {
    console.log(e)
    return { 
      status: 400,
      body: JSON.stringify(e)
    }
  }
}

export async function patch(event: RequestEvent) {
  try {
    if (event.locals.user.id) {
      const item = await event.request.formData()
      if (item.get('id')) {
        // let fileError
        let filePath
        if (item.get('image')) {
          // Do Image upload first
          const file = item.get('image')
          const { data: imageData, error: imageError } = await supabase
            .storage
            .from('expired')
            .upload(`${event.locals.user.id}/${item.get('id')}`, file, {
              contentType: file.type,
              upsert: true
            })
          if (imageError) {
            console.error('Error:', imageError)
          }
          if (imageData && imageData.Key) {
            filePath = imageData.Key
          }
        }
        const update = {}
        if (item.get('name')) {
          update.name = item.get('name')
        }
        if (item.get('startTime')) {
          update.startTime = item.get('startTime')
        }
        if (item.get('endTime')) {
          update.endTime = item.get('endTime')
        }
        if (item.get('category')) {
          // This is weird...
          let category = item.get('category')
          if (category === 'null') {
            category = null
          }
          update.category = category
        }
        if (filePath) {
          update.imagePath = `${item.get('id')}`
        }
        if (item.get('image') === 'null' && item.get('imagePath')) {
          const fromPath = `${event.locals.user.id}/${item.get('imagePath')}`
          const { data: removalData, error: removalError } = await supabase
            .storage
            .from('expired')
            .remove([fromPath])
            if (removalError) {
              console.error('There was a problem with removing an image:', removalError)
            }
            if (removalData && removalData.length > 0) {
              update.imagePath = null
            }
        }
        // Finally after any image/storage work, make the update to the item
        const { data, error } = await supabase
          .from('items')
          .update(update)
          .match({ id: item.get('id') })
        if (error) {
          console.error('There was a problem:', error)
          return { 
            status: 400,
            body: JSON.stringify(error)
          }
        }
        if (data) {
          return {
            status: 200,
            body: JSON.stringify(data)
          }
        }
      }
    }
  }
  catch (e) {
    console.log(e)
    return { 
      status: 400,
      body: JSON.stringify(e)
    }
  }
}

export async function post(event: RequestEvent) {
  try {
    if (event.locals.user.id) {
      const item = await event.request.formData()
      if (item.get('name') && item.get('startTime') && item.get('endTime') && event.locals.user.id) {
        let category = item.get('category')
        // This is weird...
        if (item.get('category') === 'null') {
          category = null
        }
        const { data, error } = await supabase
          .from('items')
          .insert([
            {
              name: item.get('name').trim(),
              startTime: item.get('startTime'),
              endTime: item.get('endTime'),
              category: category,
              creator: event.locals.user.id
            },
          ])
        if (error) {
          console.error('Error:', error)
          return { 
            status: 400,
            body: JSON.stringify(error)
          }
        }
        if (data && data[0].id) {
          if (item.get('image')) {
            const file = item.get('image')
            const { data: imageData, error: imageError } = await supabase
              .storage
              .from('expired')
              .upload(`${event.locals.user.id}/${data[0].id}`, file, {
                contentType: file.type
              })
            if (imageError) {
              console.error('Error:', imageError)
              return { 
                status: 400,
                body: JSON.stringify(imageError)
              }
            }
            if (imageData && imageData.Key) {
              const {data: updateData, error: updateError} = await supabase
                .from('items')
                .update({ imagePath: `${data[0].id}` })
                .match({ id: data[0].id })
              if (updateData) {
                const path = `${event.locals.user.id}/${data[0].id}`
                const { data: imageData, error: imageError } = await supabase
                  .storage
                  .from('expired')
                  .createSignedUrl(path, 600)
                if (imageError) {
                  console.log('imageError:')
                  console.log(imageError)
                }
                if (imageData) {
                  updateData[0].image = imageData.signedURL
                }
                return { 
                  status: 200,
                  body: JSON.stringify(updateData)
                }
              }
              if (updateError) {
                console.error('Error:', updateError)
                return { 
                  status: 400,
                  body: JSON.stringify(updateError)
                }
              }
            }
          }
          else {
            return { 
              status: 200,
              body: JSON.stringify(data)
            }
          }
        }
      }
    }
  }
  catch (e) {
    console.log(e)
    return { 
      status: 400,
      body: JSON.stringify(e)
    }
  }
}