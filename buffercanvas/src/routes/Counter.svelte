<script lang="ts">
	import { onMount } from 'svelte';
	import { basicSetup } from 'codemirror';
	import { EditorView, keymap } from '@codemirror/view';
	import { vim } from '@replit/codemirror-vim';
	import { EditorState } from '@codemirror/state';

	export let editorContent: string;
	export let id: number;
	export let switchFocus: Function;
	export let registerEditor: (id: number, editorView: EditorView) => void;

	let view;

	onMount(async () => {
		const parent = document?.querySelector(`#editor-${id}`);
		if (parent == null) {
			console.log(`could not find #editor-${id}`);
			return;
		}

		let state = EditorState.create({
			doc: editorContent.replaceAll(' ', '\n'),
			extensions: [basicSetup, customKeymap, vim()]
		});

		view = new EditorView({
			state,
			parent: parent
		});

		view.focus();
		view.dom.id = `view-${id}`;
		view.dom.tabIndex = -1;
		registerEditor(id, view);
	});

	function isVimNormalMode(view: EditorView) {
		// Implementieren Sie die Logik, um zu überprüfen, ob sich der Benutzer im Vim-Normalmodus befindet
		return true; // Beispielwert
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
		// ...defaultKeymap // Fügt die Standard-Keymap hinzu, um alle anderen Funktionen beizubehalten
	]);

	function navigateEditors(view: EditorView, key: string) {
		const { from } = view.state.selection.main;
		const line = view.state.doc.lineAt(from);
		const isAtStartOrEnd =
			(key === 'k' && line.number === 1) || (key === 'j' && line.number === view.state.doc.lines);

		if (isVimNormalMode(view) && isAtStartOrEnd) {
			switchFocus(id, key);
			return true; // Gibt an, dass das Event gehandhabt wurde
		}

		return false; // Gibt an, dass das Event nicht gehandhabt wurde und die Standardaktion ausgeführt werden soll
	}
</script>

<div class="mb-4" id="editor-{id}"></div>
