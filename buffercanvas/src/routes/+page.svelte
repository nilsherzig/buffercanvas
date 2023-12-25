<script lang="ts">
	/** @type {import('./$types').PageData} */
	import Editor from './Editor.svelte';
	import type { JsonSchema } from './+page';
	import type { EditorView } from 'codemirror';
	export let data: { posts: JsonSchema[] };
	let editors: Record<number, EditorView> = {};

	function registerEditor(id: number, editorView: EditorView) {
		editors[id] = editorView;
	}

	function switchFocus(currentId: number, direction: 'j' | 'k'): void {
		const currentIndex = data.posts.findIndex((post) => post.id === currentId);
		if (currentIndex === -1) return;

		let newIndex = direction === 'j' ? currentIndex + 1 : currentIndex - 1;

		if (newIndex >= 0 && newIndex < data.posts.length) {
			const newId = data.posts[newIndex].id;
			let newEditor = editors[newId];
			// const lastline = newEditor.lineCount() - 1;
			// newEditor.setCursor({ line: lastLine, ch: 0 });
			newEditor?.focus();
		}
	}
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

{#each data.posts as { id, body }}
	<div>
		<Editor {registerEditor} bind:editorContent={body} bind:id {switchFocus} />
	</div>
{/each}
