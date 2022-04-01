import { supabase } from "$lib/supabase"
import type { RequestEvent } from "@sveltejs/kit/types/internal"

export async function get(event: RequestEvent) {
  try {
    if (event.locals.user && event.locals.user.id) {
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
      status: 400,
      body: JSON.stringify(e)
    }
  }
}

export async function del(event: RequestEvent) {
  try {
    if (event.locals.user && event.locals.user.id) {
      const category = await event.request.formData()
      if (category.get('id')) {
        const { data, error } = await supabase
          .from('categories')
          .delete()
          .match({ id: category.get('id') })
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
      }
      else {
        // Handle this
      }
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
    }
  }
}

export async function patch(event: RequestEvent) {
  try {
    if (event.locals.user && event.locals.user.id) {
      const category = await event.request.formData()
      if (category.get('id')) {
        const update = {}
        if (category.get('name')) {
          update.name = category.get('name')
        }
        const { data, error } = await supabase
          .from('categories')
          .update(update)
          .match({ id: category.get('id') })
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
      }
      else {
        // Handle this
      }
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
    }
  }
}

export async function post(event: RequestEvent) {
  try {
    if (event.locals.user && event.locals.user.id) {
      const category = await event.request.formData()
      if (category.get('name')) {
        const { data, error } = await supabase
          .from('categories')
          .insert([
            {
              name: category.get('name').trim(),
              creator: event.locals.user.id
            },
          ])
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
      }
      else {
        // Handle this
      }
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
    }
  }
}