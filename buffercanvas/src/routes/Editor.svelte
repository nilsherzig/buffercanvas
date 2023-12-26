<script lang="ts">
	import { onMount } from 'svelte';
	import { basicSetup } from 'codemirror';
	import { EditorView, keymap } from '@codemirror/view';
	import { vim, getCM } from '@replit/codemirror-vim';
	import { EditorState } from '@codemirror/state';
	import MarkdownPreview from './MarkdownPreview.svelte';

	import { StreamLanguage } from '@codemirror/language';
	import { go } from '@codemirror/legacy-modes/mode/go';
	import { markdown } from '@codemirror/lang-markdown';

	export let code: string;
	export let uuid: string;
	export let switchFocus: Function;
	export let language: string;
	export let registerEditor: (id: string, editorView: EditorView) => void;

	let view: EditorView;
	let editorContent: string;

	onMount(async () => {
		const parent = document?.querySelector(`#editor-${uuid}`);
		if (parent == null) {
			console.log(`could not find #editor-${uuid}`);
			return;
		}

		let extensions = [basicSetup, customKeymap, vim()];

		switch (language) {
			case 'golang':
				extensions.push(StreamLanguage.define(go));
				break;
			case 'markdown':
				extensions.push(markdown());
				break;
		}

		let state = EditorState.create({
			doc: code,
			extensions: extensions
		});

		view = new EditorView({
			state,
			parent: parent,
			dispatch: (tr) => {
				view.update([tr]);
				editorContent = view.state.doc.toString();
				centerCursor(view);
			}
		});

		editorContent = view.state.doc.toString();
		view.focus();
		view.dom.id = `view-${uuid}`;
		view.dom.tabIndex = -1;
		registerEditor(uuid, view);
	});

	function isVimInsertMode(view: EditorView) {
		return getCM(view)?.state.vim['insertMode'];
	}

	const customKeymap = keymap.of([
		{
			key: 'j',
			run: (view) => navigateEditors(view, 'j'),
			preventDefault: false
		},
		{
			key: 'k',
			run: (view) => navigateEditors(view, 'k'),
			preventDefault: false
		}
		// ...defaultKeymap
	]);

	function navigateEditors(view: EditorView, key: string) {
		const { from } = view.state.selection.main;
		const line = view.state.doc.lineAt(from);
		const isAtStartOrEnd =
			(key === 'k' && line.number === 1) || (key === 'j' && line.number === view.state.doc.lines);

		if (!isVimInsertMode(view) && isAtStartOrEnd) {
			switchFocus(uuid, key);
			return true;
		}

		return false;
	}

	function centerCursor(view: EditorView) {
		// Get the position of the cursor in the document
		const cursorPos = view.state.selection.main.head;

		// Find the coordinates of this position in the viewport
		const cursorCoords = view.coordsAtPos(cursorPos);

		if (!cursorCoords) return; // Exit if the coordinates are not found

		const cursorVerticalPosition = cursorCoords.top;

		const windowHeight = window.innerHeight;

		let margin = 50;
		if (cursorVerticalPosition + margin < windowHeight / 2) {
			window.scrollTo({
				left: 0,
				top: window.scrollY + cursorVerticalPosition + margin - windowHeight / 2,
				behavior: 'smooth'
			});
		}
		if (cursorVerticalPosition - margin > windowHeight / 2) {
			window.scrollTo({
				left: 0,
				top: window.scrollY + cursorVerticalPosition - margin - windowHeight / 2,
				behavior: 'smooth'
			});
		}
	}
</script>

{#if language == 'markdown'}
	<div class="flex gap-4 border-2 mb-4">
		<div class="grow" id="editor-{uuid}"></div>
		<div class="grow">
			<MarkdownPreview bind:editorContent />
		</div>
	</div>
{:else}
	<div class="border-2 mb-4" id="editor-{uuid}"></div>
{/if}
