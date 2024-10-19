<script lang="ts">
  import { goto } from '$app/navigation'; // Import the goto function
  import FormComponent from '../components/input/FormComponent.svelte';
  import { files, imageUrls } from '../stores/imageStore';

  let fileInput: HTMLInputElement;

  // Delay function using setTimeout wrapped in a Promise
  function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function handleFileInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target && target.files) {
      const selectedFiles = [...target.files];
      files.set(selectedFiles); // Update the files store
      updateImageUrls(selectedFiles);
      target.value = ''; // Reset the input
    }
  }

  async function updateImageUrls(selectedFiles: File[]): Promise<void> {
    // Navigate to the image page once files are uploaded
    if (selectedFiles.length > 0) {
      goto('/image');
    }
    
    // Add a delay before updating image URLs
    await delay(300); // Wait for 300ms

    // Revoke previous object URLs and create new ones
    imageUrls.update(urls => {
      urls.forEach(url => URL.revokeObjectURL(url));
      return selectedFiles.map(file => URL.createObjectURL(file));
    });
  }
</script>

<FormComponent {fileInput} />

<input type="file" multiple on:change={handleFileInput} hidden bind:this={fileInput} />
