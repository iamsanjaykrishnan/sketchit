<script lang="ts">
  import ImageEditor from '../../components/ImageEditor/ImageEditor.svelte';
  import { goto } from '$app/navigation'; 
  import { imageUrls, files } from '../../stores/imageStore'; // Import the store

  function removeImage(index: number): void {
    imageUrls.update((urls) => {
      URL.revokeObjectURL(urls[index]); // Revoke the object URL for cleanup
      return urls.filter((_, i) => i !== index); // Remove the URL from the list
    });

    files.update((f) => f.filter((_, i) => i !== index)); // Remove the corresponding file
    goto('/');
  }
</script>

{#if $imageUrls.length > 0}
  <div class="grid grid-cols-1 gap-4">
    {#each $imageUrls as url, index}
      <ImageEditor {url} removeImage={() => removeImage(index)} />
    {/each}
  </div>
{:else}
 
{/if}
