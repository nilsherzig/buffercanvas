// since there's no dynamic data here, we can prerender
// it so that it gets served as a static asset in production
// export const prerender = true;

/** @type {import('./$types').PageLoad} */

export interface JsonSchema {
  userId: number
  id: number
  title: string
  body: string
}

export async function load({ fetch }) {
  const res = await fetch(`https://jsonplaceholder.typicode.com/posts`);

  if (!res.ok) {
    console.error('Failed to fetch posts');
    return { item: null };
  }
  let posts: JsonSchema[] = await res.json();

  posts = posts.slice(0, 6)

  return { posts };
}
