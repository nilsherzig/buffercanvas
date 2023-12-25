<script>
	import Header from './Header.svelte';
	import '../app.css';
	// import './styles.css';
</script>

<div class="app">
	<Header />

	<main>
		<slot />
	</main>

	<footer></footer>
</div>
