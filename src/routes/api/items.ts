import { supabase } from "$lib/supabase"
import type { RequestEvent } from "@sveltejs/kit/types/internal"

export async function get(event: RequestEvent) {
  try {
    if (event.locals.user && event.locals.user.id && event.locals.user.account.subscription_status === 'active' && event.locals.user.account.id) {
      const params = event.url.searchParams
      const end = params.get('end')
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
      if (params.get('name')) {
        lookup = lookup.ilike('name', `%${params.get('name')}%`)
      }
      if (end) {
        const endDate = new Date(end).toISOString()
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
        // Cloudflare R2 start
        data.forEach((item) => {
          if (item.imagePath) {
            // item.image = `https://expired-worker.jeredev.workers.dev/${event.locals.user.account.id}/${item.imagePath}.webp`
            item.image = `https://expired-worker.jeredev.workers.dev/${event.locals.user.account.id}/${item.imagePath}.webp`
          }
        })
        return {
          status: 200,
          body: JSON.stringify(data)
        }
        // Loop through all items and build an array of file paths to be downloaded
        /*
        const imagePaths: (string)[] = []
        if (data.length) {
          data.forEach((item) => {
            let objPath = ''
            if (item.imagePath) {
              objPath = `${event.locals.user?.account.id}/${item.imagePath}`
            }
            imagePaths.push(objPath)
          })
          if (imagePaths.length) {
            // START: Attempt to use Cloudflare R2
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
        */
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
      throw new Error('Unauthorized')
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