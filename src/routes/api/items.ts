import { supabase } from "$lib/supabase";
import type { RequestEvent } from '@sveltejs/kit'

// Detect user.id???
export async function get(event: RequestEvent) {
  // console.log('get')
  try {
    if (event.locals.user) {
      // console.log(supabase.auth.session()) // null
      // console.log(event.locals)
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
        if (error) return
        if (data) {
          const category = data.find((category) => category.name === params.get('cat'))
          if (category) {
            lookup = lookup.eq('category', category.id)
          }
        }
      }
      const { data, error } = await lookup
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
    else {
      throw 'No user detected'
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