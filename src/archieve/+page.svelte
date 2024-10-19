<script lang="ts">
  import { onMount } from 'svelte';
  import FormComponent from '../components/input/FormComponent.svelte';
	import ImageEditor from '../components/ImageEditor/ImageEditor.svelte';

  let files: File[] = [];
  let fileInput: HTMLInputElement;
  let imageUrls: string[] = [];

  function handleFileInput(event: Event): void {
    console.log('handleFileInput called');
    const target = event.target as HTMLInputElement;
    if (target && target.files) {
      console.log('Files selected:', target.files);
      files = [...target.files];
      updateImageUrls();
      target.value = ''; // Reset the input
    }
  }

  function handleDragOver(event: DragEvent): void {
    console.log('handleDragOver called');
    event.preventDefault();
  }

  function handleDrop(event: DragEvent): void {
    console.log('handleDrop called');
    event.preventDefault();
    if (event.dataTransfer && event.dataTransfer.files) {
      console.log('Files dropped:', event.dataTransfer.files);
      files = [...event.dataTransfer.files];
      updateImageUrls();
    }
  }

  function updateImageUrls(): void {
    console.log('updateImageUrls called with files:', files);
    imageUrls.forEach((url) => URL.revokeObjectURL(url));
    imageUrls = files.map((file) => URL.createObjectURL(file));
    console.log('Updated imageUrls:', imageUrls);
  }

  function removeImage(index: number): void {
    console.log('removeImage called with index:', index);
    URL.revokeObjectURL(imageUrls[index]);
    files = files.filter((_, i) => i !== index);
    imageUrls = imageUrls.filter((_, i) => i !== index);
    console.log('Updated files:', files);
    console.log('Updated imageUrls after removal:', imageUrls);
  }
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="from-cream-200 via-cream-300 to-cream-400 flex min-h-screen items-center justify-center bg-gradient-to-r p-4 font-sans"
  on:dragover={handleDragOver}
  on:drop={handleDrop}
>
  {#if imageUrls.length === 0}
    <FormComponent {fileInput} />
  {:else}
    <div class="grid grid-cols-1 gap-4">
      {#each imageUrls as url, index}
        <ImageEditor {url} removeImage={() => removeImage(index)} />
      {/each}
    </div>
  {/if}
</div>

<input type="file" multiple on:change={handleFileInput} hidden bind:this={fileInput} />
