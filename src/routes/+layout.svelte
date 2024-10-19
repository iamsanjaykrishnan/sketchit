<script lang="ts">
	import '../app.css';
	import '../tailwind.css';
	import '@fortawesome/fontawesome-free/css/all.min.css';
</script>

<!-- Common background and layout structure -->
<div
	class="from-gray-800 via-gray-900 to-black flex min-h-screen items-center justify-center bg-gradient-to-r p-4 font-sans text-white"
>
	<slot />
</div>

<style>
	/* You can add layout-specific styles here if needed */
</style>