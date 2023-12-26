<script lang="ts">
	// import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
	import { marked } from 'marked';
	import { tick } from 'svelte';
	import mermaid from 'mermaid';

	let htmlContent: string;
	export let editorContent: string;
	$: if (editorContent) updateHTML();

	async function updateHTML() {
		if (editorContent && window.MathJax) {
			const tempHtmlContent = marked.parse(editorContent);
			htmlContent = await tempHtmlContent; // Aktualisieren des DOMs mit Markdown-Inhalt

			// Warten, bis der DOM aktualisiert ist, dann MathJax aufrufen
			await tick();
			await MathJax.typesetPromise().catch((err) => {
				console.error('MathJax rendering error:', err);
			});
			const mermaidDiagrams = document.querySelectorAll('.language-mermaid'); // TODO regenerates entire site
			mermaidDiagrams.forEach((diagram) => {
				mermaid.init(undefined, diagram);
				console.log('rebuilding');
			});
		}
	}
</script>

<article class="prose prose-sm" id="prose">
	{@html htmlContent}
</article>
