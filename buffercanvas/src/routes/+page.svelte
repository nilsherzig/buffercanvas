<script lang="ts">
	/** @type {import('./$types').PageData} */
	import Editor from './Editor.svelte';
	import type { JsonSchema } from './+page.server';
	import type { EditorView } from 'codemirror';
	export let data: { posts: JsonSchema[] };
	let editors: Record<string, EditorView> = {};

	function registerEditor(uuid: string, editorView: EditorView) {
		editors[uuid] = editorView;
	}

	function switchFocus(currentUUID: string, direction: 'j' | 'k'): void {
		const currentIndex = data.posts.findIndex((post) => post.uuid === currentUUID);
		if (currentIndex === -1) return;

		let newIndex = direction === 'j' ? currentIndex + 1 : currentIndex - 1;

		if (newIndex >= 0 && newIndex < data.posts.length) {
			const newId = data.posts[newIndex].uuid;
			let newEditor = editors[newId];
			if (newIndex > currentIndex) {
				newEditor.dispatch({ selection: { anchor: newEditor.state.doc.line(1).from } });
			} else {
				let lastLine = newEditor.state.doc.lines;
				newEditor.dispatch({ selection: { anchor: newEditor.state.doc.line(lastLine).from } });
			}
			newEditor?.focus();
		}
	}
	console.log(data.posts);
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
	<script
		id="MathJax-script"
		async
		src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
	></script>
</svelte:head>

{#each data.posts as { uuid, code, language }}
	<div>
		<Editor {registerEditor} bind:code bind:uuid {switchFocus} bind:language />
	</div>
{/each}

<style lang="postcss">
	:global(html) {
		background-color: theme(colors.zinc.100);
	}
</style>
