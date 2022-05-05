import { supabase } from "$lib/supabase"
import type { RequestEvent } from "@sveltejs/kit/types/internal"

export async function get(event: RequestEvent) {
  try {
    if (event.locals.user && event.locals.user.id && event.locals.user.account.subscription_status === 'active' && event.locals.user.account.id) {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          id,
          name
        `)
        .eq('account', event.locals.user.account.id)
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
      throw new Error('Unauthorized.')
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
    if (event.locals.user && event.locals.user.id && event.locals.user.account.id && event.locals.user.account.subscription_status === 'active') {
      const category = await event.request.formData()
      if (category.get('id')) {
        const { data, error } = await supabase
          .from('categories')
          .delete()
          .match({ 
            id: category.get('id'),
            account: event.locals.user.account.id
          })
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
        throw new Error('No category id detected')
      }
    }
    else {
      throw new Error('No user detected')
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
    if (event.locals.user && event.locals.user.id && event.locals.user.account.subscription_status === 'active') {
      const category = await event.request.formData()
      if (category.get('id') && category.get('name')) {
        // const update = {}
        // if (category.get('name')) {
        //   update.name = category.get('name')
        // }
        const { data, error } = await supabase
          .from('categories')
          .select(`
            id,
            name
          `)
          .match({
            name: category.get('name'),
            account: event.locals.user.account.id
          })
        if (error) {
          console.log('error: ', error)
        }
        if (data) {
          if (data[0]) {
            throw new Error('Category already exists')
          }
          else {
            const { data: dataUpdate, error: errorUpdate } = await supabase
              .from('categories')
              .update({
                name: category.get('name')
              })
              .match({ id: category.get('id') })
            if (dataUpdate) {
              return {
                status: 200,
                body: JSON.stringify(dataUpdate)
              }
            }
            if (error) {
              console.error('Error:', errorUpdate)
              return {
                status: 400,
                body: JSON.stringify(errorUpdate)
              }
            }
          }
        }
      }
      else {
        // Handle this
        throw new Error('No category id detected')
      }
    }
    else {
      throw new Error('No user detected')
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
    if (event.locals.user && event.locals.user.id && event.locals.user.account.subscription_status === 'active') {
      const category = await event.request.formData()
      if (category.get('name')) {
        const { data, error } = await supabase
          .from('categories')
          .select(`
            id,
            name
          `)
          .match({
            name: category.get('name'),
            account: event.locals.user.account.id
          })
        if (error) {
          console.log('error: ', error)
        }
        if (data) {
          if (data[0]) {
            throw new Error('Category already exists')
          }
          else {
            const { data: dataInsert, error: errorInsert } = await supabase
              .from('categories')
              .insert([
                {
                  name: category.get('name')?.toString().trim(),
                  creator: event.locals.user.id,
                  account: event.locals.user.account.id
                },
              ])
            if (dataInsert) {
              return {
                status: 200,
                body: JSON.stringify(dataInsert)
              }
            }
            if (errorInsert) {
              console.error('Error:', errorInsert)
              return {
                status: 400,
                body: JSON.stringify(errorInsert)
              }
            }
          }
        }
      }
      else {
        // Handle this
        throw new Error('No category name detected')
      }
    }
    else {
      throw new Error('No user detected')
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