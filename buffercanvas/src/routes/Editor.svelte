<script lang="ts">
	import { onMount } from 'svelte';
	import { basicSetup, minimalSetup } from 'codemirror';
	import { EditorView, keymap } from '@codemirror/view';
	import { vim, getCM } from '@replit/codemirror-vim';
	import { EditorState, Compartment } from '@codemirror/state';
	import MarkdownPreview from './MarkdownPreview.svelte';

	import { debounce, isMobile } from './debounce';
	import { StreamLanguage } from '@codemirror/language';
	import { go } from '@codemirror/legacy-modes/mode/go';
	import { markdown } from '@codemirror/lang-markdown';
	import { closeBrackets } from '@codemirror/autocomplete';
	import {
		// githubLight,
		// githubLightInit,
		githubDark
		// githubDarkInit
	} from '@uiw/codemirror-theme-github';

	export let code: string;
	export let uuid: string;
	export let switchFocus: Function;
	export let language: string;
	export let registerEditor: (id: string, editorView: EditorView) => void;

	let view: EditorView;
	let editorContent: string;
	let vimmode = true;

	onMount(async () => {
		const parentElem = document?.querySelector(`#editor-${uuid}`);
		if (parentElem == null) {
			console.log(`could not find #editor-${uuid}`);
			return;
		}
		const theme = new Compartment();

		let extensions = [
			theme.of(githubDark),
			githubDark,
			customKeymap,
			minimalSetup,
			closeBrackets()
		];

		if (isMobile()) {
			vimmode = false;
		}

		if (vimmode) {
			extensions.push(vim());
		}

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
			parent: parentElem,
			dispatch: (tr) => {
				view.update([tr]);
				editorContent = view.state.doc.toString();
				debouncedcenterCursor(view);
			}
		});

		function setFontSize(size: number) {
			let currentTheme = EditorView.theme({
				'.cm-content': {
					fontSize: size + 'rem'
				},
				'.cm-gutters': {
					fontSize: size + 'rem'
				}
			});

			view.dispatch({
				effects: theme.reconfigure(currentTheme)
			});
		}
		setFontSize(1);

		editorContent = view.state.doc.toString();
		view.focus();
		view.dom.id = `view-${uuid}`;
		view.dom.classList.add('bg-zinc-900');
		// view.dom.tabIndex = -1;
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

		if (!isVimInsertMode(view) && isAtStartOrEnd && vimmode) {
			switchFocus(uuid, key);
			return true;
		}

		return false;
	}

	function centerCursor(view: EditorView) {
		const cursorPos = view.state.selection.main.head;
		const cursorCoords = view.coordsAtPos(cursorPos);
		if (!cursorCoords) return;
		const cursorVerticalPosition = cursorCoords.top;
		const windowHeight = window.innerHeight;
		let margin = 100;

		console.log('scrolling');
		if (cursorVerticalPosition + margin < windowHeight / 2) {
			window.scrollTo({
				// left: 0,
				top: window.scrollY + cursorVerticalPosition + margin - windowHeight / 2,
				behavior: 'smooth'
			});
		}
		if (cursorVerticalPosition - margin > windowHeight / 2) {
			window.scrollTo({
				// left: 0,
				top: window.scrollY + cursorVerticalPosition - margin - windowHeight / 2,
				behavior: 'smooth'
			});
		}
	}
	const debouncedcenterCursor = debounce(centerCursor, 10);
</script>

{#if language == 'markdown'}
	<div class="my-2 rounded m-2 shadow flex flex-wrap bg-zinc-900">
		<div class="p-2 w-full md:w-2/5 shadow">
			<MarkdownPreview bind:editorContent bind:uuid />
		</div>
		<div class="w-full pt-2 md:w-3/5" id="editor-{uuid}"></div>
	</div>
{:else}
	<div class="my-2 m-2 rounded shadow bg-zinc-900">
		<div id="editor-{uuid}"></div>
	</div>
{/if}

<style lang="postcss">
	:global(.cm-gutters) {
		background-color: theme(colors.zinc.800);
		border-radius: 0rem 0.25rem 0.25rem 0rem;
		width: 2rem;
	}
	:global(.cm-editor) {
		background-color: theme(colors.zinc.900);
		border-radius: 0.25rem;
		height: 100%;
	}
</style>
