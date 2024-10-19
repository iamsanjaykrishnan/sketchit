<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome';
  import { faTimes, faBroom, faPerson, faFaceSmile,faBorderAll } from '@fortawesome/free-solid-svg-icons';
  export let landmarkersInitialized: boolean;
  export let poseVisible: boolean;
  export let faceVisible: boolean;
  const dispatch = createEventDispatcher();

  function removeImage() {
    dispatch('removeImage');
  }

  function detectPose() {
    dispatch('detectPose');
  }

  function toggleFaceLandmark() {
    dispatch('toggleFaceLandmark');
  }
</script>

<div class="grid grid-cols-3 gap-4">
  <div class="left-0 gap-2">
    <button
      class="rounded-full bg-transparent p-1 text-gray-800"
      on:click={removeImage}
      title="Remove Image"
    >
      <FontAwesomeIcon icon={faTimes} />
    </button>
    <button
    class="rounded-full bg-transparent p-1 text-gray-800"
    on:click={removeImage}
    title="Remove Image"
  >
    <FontAwesomeIcon icon={faBroom} />
  </button>
  </div>
  <div></div>
  <div class="gap-2 text-right">
    <button
      class="rounded-full bg-transparent p-1 text-gray-800"
      on:click={detectPose}
      disabled={!landmarkersInitialized}
      title={landmarkersInitialized
        ? poseVisible
          ? 'Hide Pose'
          : 'Detect Pose'
        : 'Initializing...'}
    >
      <FontAwesomeIcon icon={faPerson} />
    </button>
    <button
      class="rounded-full bg-transparent p-1 text-gray-800"
      on:click={toggleFaceLandmark}
      disabled={!landmarkersInitialized}
      title={landmarkersInitialized
        ? faceVisible
          ? 'Hide Face Landmarks'
          : 'Detect Face Landmarks'
        : 'Initializing...'}
    >
      <FontAwesomeIcon icon={faFaceSmile} />
    </button>
    <button
    class="rounded-full bg-transparent p-1 text-gray-800"
    on:click={toggleFaceLandmark}
    disabled={!landmarkersInitialized}
    title={landmarkersInitialized
      ? faceVisible
        ? 'Hide Face Landmarks'
        : 'Detect Face Landmarks'
      : 'Initializing...'}
  >
    <FontAwesomeIcon icon={faBorderAll} />
  </button>
  </div>
</div>
