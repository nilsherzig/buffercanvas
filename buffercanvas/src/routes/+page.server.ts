/** @type {import('./$types').PageLoad} */

export interface JsonSchema {
  uuid: string
  code: string
  language: string
}

export async function load({ fetch }) {
  const res = await fetch(`http://localhost:3000/api/load`);

  if (!res.ok) {
    console.error('Failed to fetch posts');
    return { item: null };
  }
  let posts: JsonSchema[] = await res.json();
  console.log(posts)

  posts = posts.slice(0, 6)

  return { posts };
}
