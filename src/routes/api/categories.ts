import { supabase } from "$lib/supabase";
import type { RequestEvent } from '@sveltejs/kit'

// Detect user.id???
export async function get(event: RequestEvent) {
  try {
    if (event.locals.user) {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          id,
          name
        `)
        .order('name', {ascending: true})
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
      body: JSON.stringify(e)
    };
  }
}