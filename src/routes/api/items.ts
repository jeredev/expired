import { supabase } from "$lib/supabase"
import type { RequestEvent } from "@sveltejs/kit/types/internal"

export async function get(event: RequestEvent) {
  try {
    if (event.locals.user && event.locals.user.id && event.locals.user.account.subscription_status === 'active' && event.locals.user.account.id) {
      const params = event.url.searchParams
      let lookup = supabase
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
        .eq('account', event.locals.user.account.id)
        // .limit(1)
      if (params.get('name')) {
        lookup = lookup.ilike('name', `%${params.get('name')}%`)
      }
      if (params.get('end')) {
        const endDate = new Date(params.get('end')).toISOString()
        lookup = lookup.lte('endTime', endDate)
      }
      if (params.get('cat')) {
        const { data, error } = await supabase
          .from('categories')
          .select(`
            id,
            name
          `)
        if (error) {
          console.log(error)
          return {
            status: 400, // error.status does not work?
            body: JSON.stringify(error)
          }
        }
        if (data) {
          const category = data.find((category) => category.name === params.get('cat'))
          if (category) {
            lookup = lookup.eq('category', category.id)
          }
        }
      }
      const { data, error } = await lookup
      if (data) {
        // Loop through all items and build an array of file paths to be downloaded
        const imagePaths = []
        if (data.length) {
          data.forEach((item) => {
            let objPath
            if (item.imagePath) {
              objPath = `${event.locals.user.id}/${item.imagePath}`
            }
            imagePaths.push(objPath)
          })
          if (imagePaths.length) {
            const chunks = []
            const chunkSize = 40
            let chunkTracker = 0
            for (let i = 0; i < imagePaths.length; i += chunkSize) {
              const chunk = imagePaths.slice(i, i + chunkSize);
              if (chunk.length) {
                chunks.push(chunk)
              }
            }
            for (const chunk of chunks) {
              const { data: storageData, error: storageError } = await supabase
                .storage
                .from('expired')
                .createSignedUrls(chunk, 600)
              if (storageError) {
                console.log(storageError)
              }
              if (storageData) {
                // Distribute signed URLS to proper items
                storageData.forEach((obj, index) => {
                  const dataIndex = (chunkTracker * chunkSize) + index
                  data[dataIndex].image = obj.signedURL
                })
              }
              chunkTracker++
            }
            return {
              status: 200,
              body: JSON.stringify(data)
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
      if (error) {
        console.error('Error:', error)
        return {
          status: 400,
          body: JSON.stringify(error)
        }
      }
      return
    }
    else {
      throw 'Unauthorized'
    }
  }
  catch (e) {
    console.log(e);
    return { 
      status: 400,
      body: JSON.stringify(e)
    };
  }
}