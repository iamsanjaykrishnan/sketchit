<script lang="ts">
  export let fileInput: HTMLInputElement;
</script>

<div class="flex w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-white shadow-xl md:flex-row">
  <div class="relative flex w-full flex-none items-center justify-center bg-gradient-to-r from-yellow-400 via-red-400 to-pink-500 p-4 md:w-48 md:rounded-l-lg">
    <p class="text-xl font-bold text-white">Sketchly</p>
  </div>
  <form class="flex-auto bg-gradient-to-br from-white via-blue-50 to-blue-100 p-6">
    <div class="flex flex-wrap">
      <h1 class="w-full text-lg font-semibold text-slate-900">
        Sketchly - Your Creative Companion
      </h1>
      <div class="mt-2 w-full text-sm font-medium text-slate-700">
        Empowering your creative process, one sketch at a time.
      </div>
    </div>
    <div class="mb-6 mt-4 border-b border-slate-300 pb-6"></div>
    <div class="mb-6 flex flex-col space-y-4 text-sm font-medium md:flex-row md:space-x-4 md:space-y-0">
      <button
        class="h-10 w-full rounded-md bg-gradient-to-r from-green-400 to-blue-500 px-6 font-semibold text-white hover:from-green-500 hover:to-blue-600 md:w-auto"
        type="button"
        on:click={() => fileInput.click()}
      >
        Start with an image
      </button>
    </div>
    <p class="text-center text-sm text-slate-700 md:text-left">
      Privacy centric. Processed only in your browser.
    </p>
  </form>
</div>