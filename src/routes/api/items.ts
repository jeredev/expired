import { supabase } from "$lib/supabase";
import type { RequestEvent } from '@sveltejs/kit'

// Detect user.id???
export async function get(event: RequestEvent) {
  try {
    // console.log(event.url.searchParams)
    const params = event.url.searchParams
    let fetch = supabase
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
    if (params.get('name')) {
      fetch = fetch.ilike('name', `%${params.get('name')}%`)
    }
    if (params.get('end')) {
      const endDate = new Date(params.get('end')).toISOString()
      fetch = fetch.lte('endTime', endDate)
    }
    if (params.get('cat')) {
      // const category = categories.find((category) => category.name === query.cat)
      // fetch = fetch.eq('category', `${category.id}`)
    }
    const { data, error } = await fetch
    if (data) {
      return {
        status: 200,
        body: JSON.stringify(data)
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
  catch (e) {
    console.log(e);
    return { 
      body: JSON.stringify(e)
    };
  }
}