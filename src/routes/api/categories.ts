import { supabase } from "$lib/supabase";

export async function get() {
  try {
    const fetch = supabase
      .from('categories')
      .select(`
        id,
        name
      `)
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
        body: JSON.stringify({error})
      }
    }
    return
    // return {
    //   status: 200,
    //   body: JSON.stringify({data, error})
    // }
  }
  catch (e) {
    console.log({e});
    return { 
      body: JSON.stringify({e})
    };
  }
}