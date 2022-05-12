import { supabase } from "$lib/supabase"
import sharp from 'sharp'

import type { RequestEvent } from "@sveltejs/kit/types/internal"

export async function del(event: RequestEvent) {
  try {
    if (event.locals.user && event.locals.user.id && event.locals.user.account.subscription_status === 'active' && event.locals.user.account.id) {
      const item = await event.request.formData()
      if (item.get('id')) {
        const { data, error } = await supabase
          .from('items')
          .delete()
          .match({ 
            id: item.get('id'),
            account: event.locals.user.account.id
          })
        if (error) {
          console.error('There was a problem:', error)
          return { 
            status: 400,
            body: JSON.stringify(error)
          }
        }
        if (data) {
          if (data[0] && data[0].imagePath) {
            const r2Delete = await fetch(`https://expired-worker.jeredev.workers.dev/${event.locals.user?.account.id}/${data[0].id}.webp`, {
              method: 'DELETE',
              headers: {
                'X-Custom-Auth-Key': String(process.env.CLOUDFLARE_AUTH_KEY_SECRET)
              }
            })
            if (r2Delete.ok) {
              // console.log('r2Delete.ok')
              // update.imagePath = null
            }
            if (!r2Delete.ok) {
              // console.log('!r2Delete.ok')
            }
            // const fromPath = `${event.locals.user.account.id}/${data[0].imagePath}`
            // const { error: storageError } = await supabase
            //   .storage
            //   .from('expired')
            //   .remove([fromPath])
            // if (storageError) {
            //   return { 
            //     status: 400,
            //     body: JSON.stringify(storageError)
            //   }
            // }
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
    if (event.locals.user && event.locals.user.id && event.locals.user.account.subscription_status === 'active') {
      const item = await event.request.formData()
      const itemCategory = item.get('category')
      const itemEndTime = item.get('endTime')
      const itemId = item.get('id')
      const itemImage = item.get('image')
      const itemImagePath = item.get('imagePath')
      const itemName = item.get('name')
      const itemStartTime = item.get('startTime')
      if (itemId) {
        // let fileError
        let filePath
        if (itemImage) {
          // Do Image upload first
          const file = itemImage
          // if (file instanceof File) {
            const arrayBuffer = await file.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            await sharp(buffer)
              .rotate()
              .resize({ width: 1024 })
              .webp()
              .toBuffer({ resolveWithObject: true })
              .then(async({ data: sharpData, info }) => { 
                // console.log(sharpData) //  <Buffer ...
                // console.log(process.env.CLOUDFLARE_AUTH_KEY_SECRET)
                // START: Upload to R2
                const r2Upload = await fetch(`https://expired-worker.jeredev.workers.dev/${event.locals.user?.account.id}/${itemId}.${info.format}`, {
                  method: 'PUT',
                  body: sharpData,
                  headers: {
                    'X-Custom-Auth-Key': String(process.env.CLOUDFLARE_AUTH_KEY_SECRET)
                  }
                })
                if (r2Upload.ok) {
                  // console.log('r2Upload ok')
                  filePath = itemId
                }
                if (!r2Upload.ok) {
                  // console.log('!r2Upload ok')
                }
                // filePath = itemId
                // const { data: imageData, error: imageError } = await supabase
                //   .storage
                //   .from('expired')
                //   .upload(`${event.locals.user?.account.id}/${itemId}`, sharpData, {
                //     contentType: `image/${info.format}`,
                //     upsert: true
                //   })
                // if (imageError) {
                //   console.error('Error:', imageError)
                //   throw imageError
                // }
                // if (imageData && imageData.Key) {
                //   filePath = imageData.Key
                // }
              })
              .catch(err => {
                console.log(err)
                throw new Error('Sharp error!')
              })
          // }
        }
        interface update {
          name?: FormDataEntryValue,
          startTime?: FormDataEntryValue,
          endTime?: FormDataEntryValue,
          category?: FormDataEntryValue | null,
          imagePath?: FormDataEntryValue | null
        }
        const update: update = {}
        if (itemName) {
          update.name = itemName
        }
        if (itemStartTime) {
          update.startTime = itemStartTime
        }
        if (itemEndTime) {
          update.endTime = itemEndTime
        }
        if (itemCategory && itemCategory !== 'null') {
          update.category = itemCategory
        }
        else {
          update.category = null
        }
        if (filePath) {
          update.imagePath = itemId
        }
        if (!itemImage && itemImagePath) {
          // START: R2 Object Deletion
          const r2Delete = await fetch(`https://expired-worker.jeredev.workers.dev/${event.locals.user?.account.id}/${itemId}.webp`, {
            method: 'DELETE',
            headers: {
              'X-Custom-Auth-Key': String(process.env.CLOUDFLARE_AUTH_KEY_SECRET)
            }
          })
          if (r2Delete.ok) {
            // console.log('r2Delete.ok')
            update.imagePath = null
          }
          if (!r2Delete.ok) {
            // console.log('!r2Delete.ok')
          }
          /*
          const fromPath = `${event.locals.user.account.id}/${itemImagePath}`
          const { data: removalData, error: removalError } = await supabase
            .storage
            .from('expired')
            .remove([fromPath])
            if (removalError) {
              console.error('There was a problem with removing an image:', removalError)
              throw removalError
            }
            if (removalData && removalData.length > 0) {
              update.imagePath = null
            }
          */
        }
        // Finally after any image/storage work, make the update to the item
        const { error } = await supabase
          .from('items')
          .update(update, {
            returning: 'minimal'
          })
          .match({ id: itemId })
        // console.log('done') // Works
        if (error) {
          console.log('error')
          throw error
        }
        const { data: lookupData, error: lookupError } = await supabase
          .from('items')
          .select(`
            id,
            name,
            startTime,
            endTime,
            category (
              id,
              name
            ),
            imagePath
          `)
          .match({ id: itemId })
        if (lookupError) {
          console.log('lookupError')
          throw lookupError
        }
        if (lookupData) {
          // console.log(lookupData[0])
          if (itemImage && itemImage !== null) {
            lookupData[0].image = `https://expired-worker.jeredev.workers.dev/${event.locals.user.account.id}/${lookupData[0].id}.webp`
            // const path = `${event.locals.user.account.id}/${lookupData[0].id}`
            // const { data: imageData, error: imageURLError } = await supabase
            //   .storage
            //   .from('expired')
            //   .createSignedUrl(path, 600)
            // if (imageURLError) {
            //   console.error('imageError:', imageURLError)
            //   // response = imageURLError
            //   throw imageURLError
            // }
            // if (imageData) {
            //   lookupData[0].image = imageData.signedURL
            // }
          }
          return {
            status: 200,
            body: JSON.stringify(lookupData)
          }
        }
      }
      
      else {
        throw new Error('No item id')
      }
    }
    else {
      throw new Error('Unauthorized')
    }
  }
  catch (e) {
    console.log('catch')
    console.log(e)
    return { 
      status: 400,
      body: JSON.stringify(e)
    }
  }
}

export async function post(event: RequestEvent) {
  try {
    if (event.locals.user && event.locals.user.id && event.locals.user.account.subscription_status === 'active') {
      const item = await event.request.formData()
      if (item.get('name') && item.get('startTime') && item.get('endTime') && event.locals.user.id && event.locals.user.account.id) {
        let category = item.get('category')
        if (!item.get('category')) {
          category = null
        }
        const { data, error } = await supabase
          .from('items')
          .insert([
            {
              name: item.get('name')?.toString().trim(),
              startTime: item.get('startTime'),
              endTime: item.get('endTime'),
              category: category,
              creator: event.locals.user.id,
              account: event.locals.user.account.id
            },
          ])
        if (error) {
          // Something went wrong with inserting an item into the database
          console.error('Error:', error)
          return { 
            status: 400,
            body: JSON.stringify(error)
          }
        }
        if (data && data[0].id) {
          if (item.get('image')) {
            const file = item.get('image')
            // if (file instanceof File) {
              const arrayBuffer = await file.arrayBuffer()
              const buffer = Buffer.from(arrayBuffer)
              let response = null
              await sharp(buffer)
                .rotate()
                .resize({ width: 1024 })
                .webp()
                .toBuffer({ resolveWithObject: true })
                .then(async({ data: sharpData, info }) => { 
                  // console.log(sharpData) //  <Buffer ...
                  // START: R2 Object Upload
                  // START: Upload to R2
                  const r2Upload = await fetch(`https://expired-worker.jeredev.workers.dev/${event.locals.user?.account.id}/${data[0].id}.${info.format}`, {
                    method: 'PUT',
                    body: sharpData,
                    headers: {
                      'X-Custom-Auth-Key': String(process.env.CLOUDFLARE_AUTH_KEY_SECRET)
                    }
                  })
                  if (r2Upload.ok) {
                    // console.log('r2Upload ok')
                    const {error: updateError} = await supabase
                      .from('items')
                      .update(
                        { imagePath: `${data[0].id}` },
                        { returning: 'minimal' }
                      )
                      .match({ id: data[0].id })
                    if (updateError) {
                      // Something went wrong with linking the item to its image
                      console.error('Error:', updateError)
                      response = updateError
                    }
                    const { data: lookupData, error: lookupError } = await supabase
                      .from('items')
                      .select(`
                        id,
                        name,
                        startTime,
                        endTime,
                        category (
                          id,
                          name
                        ),
                        imagePath
                      `)
                      .match({ id: data[0].id })
                    if (lookupError) {
                      console.log('lookupError in POST')
                      throw lookupError
                    }
                    if (lookupData) {
                      lookupData[0].image = `https://expired-worker.jeredev.workers.dev/${event.locals.user.account.id}/${lookupData[0].id}.webp`
                      response = lookupData
                      // const path = `${event.locals.user?.id}/${lookupData[0].id}`
                      // const { data: imageData, error: imageURLError } = await supabase
                      //   .storage
                      //   .from('expired')
                      //   .createSignedUrl(path, 600)
                      // if (imageURLError) {
                      //   // Something went wrong with creating a signed URL for the image
                      //   console.error('imageError:', imageURLError)
                      //   response = imageURLError
                      // }
                      // if (imageData) {
                      //   lookupData[0].image = imageData.signedURL
                      //   response = lookupData
                      // }
                    }
                  }
                  if (!r2Upload.ok) {
                    console.log('!r2Upload ok')
                  }
                  // const { data: imageData, error: imageError } = await supabase
                  //   .storage
                  //   .from('expired')
                  //   .upload(`${event.locals.user?.account.id}/${data[0].id}`, sharpData, {
                  //     contentType: `image/${info.format}`
                  //   })
                  // if (imageError) {
                  //   console.error('Error:', imageError)
                  //   throw imageError
                  //   // Notify user that image didn't upload
                  //   // response = imageError
                  //   // return {
                  //   //   status: imageError.status,
                  //   //   body: JSON.stringify(imageError)
                  //   // }
                  // }
                  // if (imageData && imageData.Key) {
                  //   // Do minimal here...
                  //   const {error: updateError} = await supabase
                  //     .from('items')
                  //     .update(
                  //       { imagePath: `${data[0].id}` },
                  //       { returning: 'minimal' }
                  //     )
                  //     .match({ id: data[0].id })
                  //   if (updateError) {
                  //     // Something went wrong with linking the item to its image
                  //     console.error('Error:', updateError)
                  //     response = updateError
                  //   }
                  //   const { data: lookupData, error: lookupError } = await supabase
                  //     .from('items')
                  //     .select(`
                  //       id,
                  //       name,
                  //       startTime,
                  //       endTime,
                  //       category (
                  //         id,
                  //         name
                  //       ),
                  //       imagePath
                  //     `)
                  //     .match({ id: data[0].id })
                  //   if (lookupError) {
                  //     console.log('lookupError in POST')
                  //     throw lookupError
                  //   }
                  //   if (lookupData) {
                  //     const path = `${event.locals.user?.id}/${lookupData[0].id}`
                  //     const { data: imageData, error: imageURLError } = await supabase
                  //       .storage
                  //       .from('expired')
                  //       .createSignedUrl(path, 600)
                  //     if (imageURLError) {
                  //       // Something went wrong with creating a signed URL for the image
                  //       console.error('imageError:', imageURLError)
                  //       response = imageURLError
                  //     }
                  //     if (imageData) {
                  //       lookupData[0].image = imageData.signedURL
                  //       response = lookupData
                  //     }
                  //   }
                  // }
                })
                .catch(err => {
                  // Something went wrong with Sharp
                  console.log(err)
                  return {
                    status: 400,
                    body: JSON.stringify({
                      message: 'Sharp caught error'
                    })
                  }
                })
              return {
                status: 200,
                body: JSON.stringify(response)
              }
            // }
          }
          else {
            // Lookup the item again...
            const { data: lookupData, error: lookupError } = await supabase
              .from('items')
              .select(`
                id,
                name,
                startTime,
                endTime,
                category (
                  id,
                  name
                ),
                imagePath
              `)
              .match({ id: data[0].id })
            if (lookupError) {
              console.log('lookupError in POST')
              throw lookupError
            }
            return { 
              status: 200,
              body: JSON.stringify(lookupData)
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