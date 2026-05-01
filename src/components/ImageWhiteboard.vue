<template>
  <a-card class="mb-6 profile-card">
      <template #title>
        <div class="flex justify-between items-center w-full gap-4">
          <span>🖼️ Digital Whiteboard ({{ images.length }} {{ images.length === 1 ? 'image' : 'images' }})</span>
          <div v-if="images.length > 0" class="header-actions-bar">
            <a-tooltip :title="selectedImageCount > 0 ? `Delete Selected (${selectedImageCount})` : 'Clear Canvas'" placement="bottom">
              <a-button
                size="middle"
                :loading="clearingAll"
                class="header-action-btn header-action-btn--danger"
                @click="handleHeaderDelete"
              >
                <template #icon><DeleteOutlined /></template>
              </a-button>
            </a-tooltip>
            <a-tooltip title="Sync & Auto-arrange" placement="bottom">
              <a-button
                size="middle"
                class="header-action-btn header-action-btn--neutral"
                @click="refreshImages"
              >
                <template #icon><ReloadOutlined /></template>
              </a-button>
            </a-tooltip>
          </div>
        </div>
      </template>
    <!-- Main Canvas Area -->
    <div
      ref="canvasRef"
      class="whiteboard-canvas mb-6 border-2 border-dashed rounded-xl bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden"
      :class="{ 'border-blue-400': isDragOver }"
      tabindex="0"
      @dblclick.stop="handleCanvasDoubleClick"
      @paste="handlePaste"
      @drop.prevent.stop="handleDrop"
      @dragenter.prevent.stop="handleDragEnter"
      @dragover.prevent.stop="handleDragOver"
      @dragleave.prevent.stop="handleDragLeave"
      @dragend="handleDragEnd"
      @mousedown.capture="onCanvasMouseDown"
      @mouseup.capture="onCanvasMouseUp"
      @mousemove="handleCanvasPan"
      @wheel="handleWheel"
    >
      <input
        ref="fileInput"
        type="file"
        multiple
        accept="image/*"
        hidden
        @change="handleFiles"
      />

      <!-- Canvas Background Grid -->
      <div class="absolute inset-0 opacity-10 pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#3b82f6" stroke-width="1"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <!-- No content when empty - just a clean canvas -->
      <div v-if="images.length === 0" class="absolute inset-0"></div>

      <!-- Uploaded Images on Canvas -->
      <div 
        v-if="images.length > 0" 
        class="absolute inset-0 p-4 pointer-events-none"
        :style="{ 
          transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasScale})`, 
          transformOrigin: '0 0' 
        }"
      >
        <!-- Dense grid layout - no gaps between images -->
        <div class="w-full h-full flex flex-wrap items-start justify-start overflow-hidden">
          <div
            v-for="(image, index) in images"
            :key="image.id"
            :data-image-id="image.id"
            data-whiteboard-image
            class="relative group pointer-events-auto hover:z-10 edge-hover-target"
            :class="getImageClass(image.id)"
            :style="getImageStyle(index)"
            draggable="false"
            @click.stop="handleImageClick(image.id)"
          >
            <!-- Image Container - Mouse events moved here for better click handling -->
            <div
              class="whiteboard-image-shell relative bg-white rounded-lg shadow-lg overflow-hidden border-2 border-gray-200 cursor-grab active:cursor-grabbing select-none"
              @mousedown="handleMouseDown($event, image.id)"
              @mouseup="handleMouseUp"
              @mousemove="handleMouseMove"
              @mouseleave="resetCursor"
              draggable="false"
            >
              <img
                :src="image.publicUrl"
                :alt="image.originalName"
                class="w-full h-full object-cover"
                loading="lazy"
                @error="handleImageError(image)"
              />

              <div
                v-if="isImageSelected(image.id)"
                class="absolute top-2 left-2 z-10 w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center shadow"
              >
                ✓
              </div>

              <!-- Action Overlay -->
              <div class="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <a-tooltip title="Copy URL" placement="top">
                  <a-button
                    size="small"
                    shape="circle"
                    @click.stop="copyImageUrl(image)"
                    :loading="copiedId === image.id"
                    class="image-action-btn image-action-btn--primary"
                  >
                    <template #icon><CopyOutlined class="text-xs" /></template>
                  </a-button>
                </a-tooltip>

                <a-tooltip title="Delete" placement="top">
                  <a-popconfirm
                    title="Delete this image?"
                    @confirm="deleteImage(image.id)"
                    @cancel="() => {}"
                  >
                    <a-button
                      size="small"
                      shape="circle"
                      class="image-action-btn image-action-btn--danger"
                    >
                      <template #icon><DeleteOutlined class="text-xs" /></template>
                    </a-button>
                  </a-popconfirm>
                </a-tooltip>

                <a-tooltip title="View Full Size" placement="top">
                  <a-button
                    size="small"
                    shape="circle"
                    @click.stop="viewFullSize(image)"
                    class="image-action-btn image-action-btn--neutral"
                  >
                    <template #icon><EyeOutlined class="text-xs" /></template>
                  </a-button>
                </a-tooltip>
              </div>

              <!-- Image Info Badge -->
              <div class="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                {{ formatFileSize(image.fileSize) }}
              </div>
            </div>

            <!-- Success Message -->
            <a-typography-text
              v-if="copiedId === image.id"
              type="success"
              class="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-sm font-medium whitespace-nowrap"
            >
              ✓ URL copied!
            </a-typography-text>
          </div>
          </div>
      </div>

      <!-- Ant Design Spin Loading -->
      <div
        v-if="showProgressOverlay"
        class="absolute inset-0 z-20 flex items-center justify-center pointer-events-none"
      >
        <div class="flex flex-col items-center justify-center text-center">
          <a-spin size="large" tip="Uploading images..." />
          <div v-if="uploadQueue.length > 0" class="mt-4">
            <p class="text-gray-700 mb-2">{{ uploadQueue.length }} file{{ uploadQueue.length === 1 ? '' : 's' }} queued</p>
            <div v-for="(item, index) in uploadQueue.slice(0, 3)" :key="index" class="text-sm text-gray-500 mb-1">
              {{ item.name }}
            </div>
            <p v-if="uploadQueue.length > 3" class="text-xs text-gray-400">+{{ uploadQueue.length - 3 }} more...</p>
          </div>
        </div>
      </div>

      <!-- Click Zone Indicator -->
      <div v-if="images.length > 0" class="absolute top-4 right-4 z-10 pointer-events-none">
        <!-- Removed Add More Images button - users can click canvas background to upload -->
      </div>
    </div>


  <!-- Initial Loading Overlay -->
      <div v-if="isLoadingImages" class="absolute inset-0 flex items-center justify-center z-30">
        <a-spin size="large" />
      </div>

      <!-- Image View Modal -->
      <a-modal
        v-model:open="isModalVisible"
        :footer="null"
        centered
        :width="800"
        :bodyStyle="{ padding: 0, backgroundColor: 'transparent' }"
        destroyOnClose
      >
        <template #title>
          <div class="flex justify-between items-center">
            <span class="text-lg font-medium">View Full Size</span>
          </div>
        </template>
        <div class="flex justify-center items-center overflow-hidden rounded-lg bg-gray-100">
          <img 
            v-if="selectedImage" 
            :src="selectedImage.publicUrl" 
            class="max-w-full max-h-[80vh] object-contain" 
            alt="Full size view"
          />
        </div>
      </a-modal>

</a-card>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { message, Modal } from "ant-design-vue";
import {
  CopyOutlined,
  DeleteOutlined,
  EyeOutlined,
  ReloadOutlined
} from "@ant-design/icons-vue";

const API_URL = import.meta.env.DEV
  ? import.meta.env.VITE_API_URL_LOCAL
  : import.meta.env.VITE_API_URL_LIVE;

// State
const images = ref([]);
const uploadQueue = ref([]);
const isModalVisible = ref(false);
const selectedImage = ref(null);
const isUploading = ref(false);
const showProgressOverlay = ref(false);
const isDragOver = ref(false);
const isLoadingImages = ref(true);
const selectedImageIds = ref(new Set());
const selectedImageCount = computed(() => selectedImageIds.value.size);

// Resize state
const resizingImageId = ref(null);
const resizeStartX = ref(0);
const resizeStartY = ref(0);
const resizeStartWidth = ref(0);
const resizeStartHeight = ref(0);

// Drag state
const draggingImageId = ref(null);
const draggedElement = ref(null);
const dragThreshold = 5; // pixels
const dragPointerOffset = ref({ x: 0, y: 0 });
const dragDimensions = ref({ width: 0, height: 0 });
const suppressCanvasClick = ref(false);
let suppressCanvasClickTimer = null;
let shouldSuppressImageClick = false;

// UI State
const clearingAll = ref(false);
const deletingId = ref(null);
const copiedId = ref(null);
const failedImages = ref(new Set());
const canvasRef = ref(null);
const fileInput = ref(null);
const error = ref("");
const success = ref("");

// Canvas Pan & Zoom state
const canvasOffset = ref({ x: 0, y: 0 });
const canvasScale = ref(1.0);
const isPanning = ref(false);
const panStartPos = ref({ x: 0, y: 0 });

// Methods
const onCanvasMouseDown = (event) => {
  // Start panning if middle-click or Ctrl+Click
  if (event.button === 1 || (event.button === 0 && event.ctrlKey)) {
    isPanning.value = true;
    panStartPos.value = { x: event.clientX - canvasOffset.value.x, y: event.clientY - canvasOffset.value.y };
    if (canvasRef.value) canvasRef.value.style.cursor = 'grabbing';
  }

  // Prevent background clicks from triggering file input
  if (!draggingImageId.value && event.target === canvasRef.value) {
    event.preventDefault();
  }
};

const onCanvasMouseUp = (event) => {
  isPanning.value = false;
  if (canvasRef.value) {
    canvasRef.value.style.cursor = 'default';
  }

  // Prevent background clicks from triggering file input
  if (event.target === canvasRef.value && !draggingImageId.value) {
    event.preventDefault();
  }
};

const handleWheel = (event) => {
  if (!event.ctrlKey) return;
  event.preventDefault();

  const zoomSpeed = 0.1;
  const delta = event.deltaY > 0 ? -zoomSpeed : zoomSpeed;
  const newScale = Math.max(0.1, Math.min(3, canvasScale.value + delta));
  
  const rect = canvasRef.value.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  const worldX = (mouseX - canvasOffset.value.x) / canvasScale.value;
  const worldY = (mouseY - canvasOffset.value.y) / canvasScale.value;

  canvasScale.value = newScale;
  canvasOffset.value = {
    x: mouseX - worldX * newScale,
    y: mouseY - worldY * newScale
  };
};

const handleCanvasPan = (event) => {
  if (!isPanning.value) return;
  
  canvasOffset.value = {
    x: event.clientX - panStartPos.value.x,
    y: event.clientY - panStartPos.value.y
  };
};

const handlePaste = async (event) => {
  event.preventDefault();

  const items = Array.from(event.clipboardData.items);

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) {
        await processFile(file);
      }
    }
  }
};

const isFileDrag = (event) => {
  const types = Array.from(event.dataTransfer?.types || []);
  return types.includes('Files');
};

const suppressCanvasClickOnce = (duration = 250) => {
  suppressCanvasClick.value = true;
  if (suppressCanvasClickTimer) {
    window.clearTimeout(suppressCanvasClickTimer);
  }

  suppressCanvasClickTimer = window.setTimeout(() => {
    suppressCanvasClick.value = false;
    suppressCanvasClickTimer = null;
  }, duration);
};

const handleDragEnter = (event) => {
  if (!isFileDrag(event)) return;
  suppressCanvasClickOnce();
  isDragOver.value = true;
};

const handleDragOver = (event) => {
  if (!isFileDrag(event)) return;
  suppressCanvasClickOnce();
  event.dataTransfer.dropEffect = 'copy';
  isDragOver.value = true;
};

const handleDragLeave = (event) => {
  if (!canvasRef.value) return;

  const nextTarget = event.relatedTarget;
  if (nextTarget && canvasRef.value.contains(nextTarget)) {
    return;
  }

  isDragOver.value = false;
};

const handleDragEnd = () => {
  suppressCanvasClickOnce();
  isDragOver.value = false;
};

const handleDrop = async (event) => {
  suppressCanvasClickOnce(400);
  isDragOver.value = false;

  const files = Array.from(event.dataTransfer?.files || []).filter(file =>
    file.type.startsWith('image/')
  );

  if (files.length > 0) {
    showProgressOverlay.value = true;
    for (const file of files) {
      await processFile(file);
    }
  }
};

// Mouse-based drag and drop handlers
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;

const handleMouseDown = (event, imageId) => {
  event.preventDefault();

  if (event.button !== 0) return;

  suppressCanvasClickOnce();

  // Check if clicking on edge for resize (within 10px of border)
  const rect = event.currentTarget?.getBoundingClientRect();
  const tolerance = 10;
  const isResizing = (
    event.clientX >= rect.right - tolerance ||
    event.clientX <= rect.left + tolerance ||
    event.clientY >= rect.bottom - tolerance ||
    event.clientY <= rect.top + tolerance
  );

  if (isResizing) {
    resizingImageId.value = imageId;
    resizeStartX.value = event.clientX;
    resizeStartY.value = event.clientY;

    const image = images.value.find(img => img.id === imageId);
    if (image) {
      resizeStartWidth.value = image.width || 120;
      resizeStartHeight.value = image.height || 120;
    }
  } else {
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    draggingImageId.value = imageId;
    isDragging = false;

    const imageElement = event.currentTarget?.closest('[data-whiteboard-image]') || event.currentTarget;
    draggedElement.value = imageElement;
    const imageRect = imageElement?.getBoundingClientRect();
    if (imageRect) {
      dragPointerOffset.value = {
        x: event.clientX - imageRect.left,
        y: event.clientY - imageRect.top
      };
      dragDimensions.value = {
        width: imageRect.width,
        height: imageRect.height
      };
    }

    const image = images.value.find(img => img.id === imageId);
    if (image?.position) {
      image.position.zIndex = 1000;
    }
  }

  event.stopPropagation();
};

const getResizeCursor = (element, event) => {
  if (!element) return 'grab';

  const rect = element.getBoundingClientRect();
  const tolerance = 12;
  const { clientX, clientY } = event;

  const leftEdge = clientX <= rect.left + tolerance;
  const rightEdge = clientX >= rect.right - tolerance;
  const topEdge = clientY <= rect.top + tolerance;
  const bottomEdge = clientY >= rect.bottom - tolerance;

  if ((topEdge && leftEdge) || (bottomEdge && rightEdge)) {
    return 'nwse-resize';
  }

  if ((topEdge && rightEdge) || (bottomEdge && leftEdge)) {
    return 'nesw-resize';
  }

  if (leftEdge || rightEdge) {
    return 'ew-resize';
  }

  if (topEdge || bottomEdge) {
    return 'ns-resize';
  }

  return 'grab';
};

const getImageWrapperFromEvent = (event) => {
  const currentTarget = event.currentTarget;
  if (currentTarget && typeof currentTarget.closest === 'function') {
    const wrapperFromCurrent = currentTarget.closest('[data-whiteboard-image]');
    if (wrapperFromCurrent) return wrapperFromCurrent;
  }

  const target = event.target;
  if (target && typeof target.closest === 'function') {
    return target.closest('[data-whiteboard-image]');
  }

  if (draggingImageId.value && canvasRef.value) {
    return canvasRef.value.querySelector(`[data-image-id="${draggingImageId.value}"]`);
  }

  if (resizingImageId.value && canvasRef.value) {
    return canvasRef.value.querySelector(`[data-image-id="${resizingImageId.value}"]`);
  }

  return null;
};

const updateHoverCursor = (event) => {
  const imageWrapper = getImageWrapperFromEvent(event);

  if (!imageWrapper) return 'grab';

  const cursor = getResizeCursor(imageWrapper, event);
  imageWrapper.style.cursor = cursor;

  const imageContainer = imageWrapper.querySelector('.whiteboard-image-shell');
  if (imageContainer) {
    imageContainer.style.cursor = cursor;
  }

  if (cursor !== 'grab') {
    imageWrapper.classList.add('edge-hover');
  } else {
    imageWrapper.classList.remove('edge-hover');
  }

  return cursor;
};

const handleMouseMove = (event) => {
  updateHoverCursor(event);

  if (!draggingImageId.value && !resizingImageId.value) return;

  suppressCanvasClickOnce();
  event.preventDefault();
  event.stopPropagation();

  const canvasRect = canvasRef.value.getBoundingClientRect();
  const worldX = (event.clientX - canvasRect.left - canvasOffset.value.x) / canvasScale.value;
  const worldY = (event.clientY - canvasRect.top - canvasOffset.value.y) / canvasScale.value;

  if (resizingImageId.value) {
    // Handle resizing
    const deltaX = (event.clientX - resizeStartX.value) / canvasScale.value;
    const deltaY = (event.clientY - resizeStartY.value) / canvasScale.value;

    const currentImage = images.value.find(img => img.id === resizingImageId.value);
    if (currentImage) {
      let newWidth = resizeStartWidth.value + deltaX;
      let newHeight = resizeStartHeight.value + deltaY;

      const aspectRatio = resizeStartWidth.value / resizeStartHeight.value;
      const minWidth = currentImage.minWidth || 120;
      const minHeight = currentImage.minHeight || 120;

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        newWidth = Math.max(minWidth, Math.min(300, resizeStartWidth.value + deltaX));
        newHeight = newWidth / aspectRatio;
      } else {
        newHeight = Math.max(minHeight, Math.min(300, resizeStartHeight.value + deltaY));
        newWidth = newHeight * aspectRatio;
      }

      newWidth = Math.max(minWidth, newWidth);
      newHeight = Math.max(minHeight, newHeight);

      currentImage.width = Math.round(newWidth);
      currentImage.height = Math.round(newHeight);
    }
  } else if (draggingImageId.value) {
    // Handle dragging (Optimized)
    const movedX = event.clientX - dragStartX;
    const movedY = event.clientY - dragStartY;

    if (!isDragging && Math.hypot(movedX, movedY) < dragThreshold) {
      return;
    }

    isDragging = true;
    suppressCanvasClickOnce();
    event.preventDefault();
    event.stopPropagation();

    const imageWidth = dragDimensions.value.width || 100;
    const imageHeight = dragDimensions.value.height || 100;

    const worldPointerX = dragPointerOffset.value.x / canvasScale.value;
    const worldPointerY = dragPointerOffset.value.y / canvasScale.value;

    const leftPx = worldX - worldPointerX;
    const topPx = worldY - worldPointerY;

    const image = images.value.find(img => img.id === draggingImageId.value);
    if (image?.position) {
      image.position.x = Math.round(leftPx);
      image.position.y = Math.round(topPx);
      image.position.zIndex = 1000;
    }
  }
};

const handleMouseUp = () => {
  if (draggingImageId.value && isDragging) {
    saveImagePositions();
    suppressCanvasClickOnce(250);
    shouldSuppressImageClick = true;
  } else if (resizingImageId.value) {
    saveImageSizes();
    suppressCanvasClickOnce(250);
    shouldSuppressImageClick = true;
  }

  // Reset cursors and classes
  const imageElements = document.querySelectorAll('[data-whiteboard-image]');
  imageElements.forEach(element => {
    element.style.cursor = 'grab';
    element.classList.remove('edge-hover');
  });

  draggingImageId.value = null;
  resizingImageId.value = null;
  isDragging = false;
  dragPointerOffset.value = { x: 0, y: 0 };
};

// Prevent background clicks from triggering file input
const isImageSelected = (imageId) => selectedImageIds.value.has(imageId);

const handleImageClick = (imageId) => {
  if (shouldSuppressImageClick) {
    shouldSuppressImageClick = false;
    return;
  }

  const next = new Set(selectedImageIds.value);
  if (next.has(imageId)) {
    next.delete(imageId);
  } else {
    next.add(imageId);
  }
  selectedImageIds.value = next;
};

const clearSelection = () => {
  selectedImageIds.value = new Set();
};

const handleCanvasDoubleClick = (event) => {
  if (event.target?.closest?.('[data-whiteboard-image]')) {
    return;
  }

  triggerFileInput();
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFiles = async (event) => {
  const files = Array.from(event.target.files).filter(file =>
    file.type.startsWith('image/')
  );

  if (files.length > 0) {
    showProgressOverlay.value = true;
    for (const file of files) {
      await processFile(file);
    }
  }

  event.target.value = '';
};

const processFile = async (file) => {
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    message.error(`File "${file.name}" is too large. Maximum size is 10MB.`);
    return;
  }

  isUploading.value = true;
  showProgressOverlay.value = true;
  error.value = '';
  success.value = '';

  const queueItem = {
    name: file.name,
    size: file.size,
    status: 'pending',
    progress: 0
  };

  uploadQueue.value.push(queueItem);

  try {
    queueItem.status = 'uploading';

    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_URL}/images/upload`, {
      method: 'POST',
      headers: {
        'x-access-token': localStorage.getItem('token') || ''
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Upload failed');
    }

    const data = await response.json();

    const initialSize = 120;
    const newImage = {
      id: data.id,
      url: data.url,
      filename: data.filename,
      originalName: data.originalName,
      fileSize: data.fileSize,
      publicUrl: data.url,
      createdAt: data.createdAt,
      position: {
        x: Math.random() * 70 + 10,
        y: Math.random() * 70 + 10
      },
      width: initialSize,
      height: initialSize,
      minWidth: initialSize,
      minHeight: initialSize
    };

    images.value.unshift(newImage);

    // Save the initial position
    localStorage.setItem(`whiteboard-image-${newImage.id}-position`, JSON.stringify(newImage.position));
    localStorage.setItem(`whiteboard-image-${newImage.id}-base-size`, JSON.stringify({
      width: newImage.minWidth,
      height: newImage.minHeight
    }));

    queueItem.status = 'completed';
    queueItem.progress = 100;

    success.value = `"${data.originalName}" added to whiteboard!`;
    message.success(success.value);

  } catch (err) {
    console.error('Upload error:', err);
    queueItem.status = 'failed';
    error.value = `Failed to upload "${file.name}": ${err.message}`;
    message.error(error.value);
  } finally {
    const hasPendingUploads = uploadQueue.value.some(item =>
      item.status === 'pending' || item.status === 'uploading'
    );

    if (!hasPendingUploads) {
      isUploading.value = false;
      window.setTimeout(() => {
        showProgressOverlay.value = false;
        uploadQueue.value = uploadQueue.value.filter(item => item.status !== 'completed');
      }, 500);
    }
  }
};

const copyImageUrl = async (image) => {
  try {
    await navigator.clipboard.writeText(image.publicUrl);
    copiedId.value = image.id;
    message.success('URL copied to clipboard!');
    setTimeout(() => {
      copiedId.value = null;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
    message.error('Failed to copy URL to clipboard');
  }
};

const deleteImageRequest = async (imageId) => {
  const response = await fetch(`${API_URL}/images/${imageId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'x-access-token': localStorage.getItem('token') || ''
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Delete failed');
  }

  localStorage.removeItem(`whiteboard-image-${imageId}-position`);
  localStorage.removeItem(`whiteboard-image-${imageId}-size`);
  localStorage.removeItem(`whiteboard-image-${imageId}-base-size`);
};

const deleteImage = async (imageId) => {
  try {
    deletingId.value = imageId;
    await deleteImageRequest(imageId);

    images.value = images.value.filter(img => img.id !== imageId);
    if (selectedImageIds.value.has(imageId)) {
      const next = new Set(selectedImageIds.value);
      next.delete(imageId);
      selectedImageIds.value = next;
    }
    message.success('Image removed from whiteboard');

  } catch (err) {
    console.error('Delete error:', err);
    message.error(`Failed to delete image: ${err.message}`);
  } finally {
    deletingId.value = null;
  }
};

const deleteSelectedImages = async () => {
  if (selectedImageIds.value.size === 0) return;

  try {
    clearingAll.value = true;
    const idsToDelete = Array.from(selectedImageIds.value);

    await Promise.all(idsToDelete.map((imageId) => deleteImageRequest(imageId)));

    images.value = images.value.filter((image) => !selectedImageIds.value.has(image.id));
    clearSelection();
    message.success('Selected images deleted');

  } catch (err) {
    console.error('Delete selected error:', err);
    message.error(`Failed to delete selected images: ${err.message}`);
  } finally {
    clearingAll.value = false;
  }
};

const clearAllImages = async () => {
  if (images.value.length === 0) return;

  try {
    clearingAll.value = true;

    const deletePromises = images.value.map(async (image) => {
      try {
        await deleteImageRequest(image.id);
      } catch (err) {
        console.error(`Failed to delete image ${image.id}:`, err);
      }
    });

    await Promise.all(deletePromises);

    images.value = [];
    clearSelection();
    message.success('Whiteboard cleared');

  } catch (err) {
    console.error('Clear all error:', err);
    message.error('Failed to clear whiteboard');
  } finally {
    clearingAll.value = false;
  }
};

const handleHeaderDelete = () => {
  if (selectedImageCount.value > 0) {
    Modal.confirm({
      title: `Delete ${selectedImageCount.value} selected images?`,
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        deleteSelectedImages();
      }
    });
    return;
  }

  Modal.confirm({
    title: 'Clear all images from whiteboard?',
    content: 'This action cannot be undone.',
    okText: 'Clear All',
    okType: 'danger',
    cancelText: 'Cancel',
    onOk() {
      clearAllImages();
    }
  });
};

const refreshImages = async () => {
  try {
    const response = await fetch(`${API_URL}/images`, {
      headers: {
        'x-access-token': localStorage.getItem('token') || ''
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to load images');
    }

    const userImages = await response.json();
    clearSelection();

    const canvasRect = canvasRef.value.getBoundingClientRect();
    const canvasWidth = canvasRect.width;
    const canvasHeight = canvasRect.height;
    const ITEM_WIDTH = 150; // image width + gap
    const COLUMNS = Math.floor(canvasWidth / ITEM_WIDTH) || 1;
    const X_GAP = ITEM_WIDTH; // pixels per column
    const Y_GAP = 160; // pixels per row
    
    const totalRows = Math.ceil(userImages.length / COLUMNS);
    const totalGridWidth = COLUMNS * X_GAP;
    const totalGridHeight = totalRows * Y_GAP;
    
    const OFFSET_X = Math.max(20, (canvasWidth - totalGridWidth) / 2);
    const OFFSET_Y = Math.max(20, (canvasHeight - totalGridHeight) / 2);

    images.value = userImages.map((image, index) => {
      const savedSizeRaw = localStorage.getItem(`whiteboard-image-${image.id}-size`);
      const baseSizeRaw = localStorage.getItem(`whiteboard-image-${image.id}-base-size`);
      const savedSize = savedSizeRaw ? JSON.parse(savedSizeRaw) : null;
      const baseSize = baseSizeRaw ? JSON.parse(baseSizeRaw) : null;

      const col = index % COLUMNS;
      const row = Math.floor(index / COLUMNS);
      
      const newPosition = {
        x: OFFSET_X + (col * X_GAP),
        y: OFFSET_Y + (row * Y_GAP),
        zIndex: index + 1
      };

      // Save the auto-arranged position
      localStorage.setItem(`whiteboard-image-${image.id}-position`, JSON.stringify(newPosition));

      return {
        ...image,
        publicUrl: image.publicUrl || image.url,
        position: newPosition,
        width: savedSize?.width || image.width || 120,
        height: savedSize?.height || image.height || 120,
        minWidth: baseSize?.width || 120,
        minHeight: baseSize?.height || 120
      };
    });
    message.success('Whiteboard synced and auto-arranged');

  } catch (err) {
    console.error('Load images error:', err);
    message.error('Failed to refresh whiteboard');
  }
};

const viewFullSize = (image) => {
  selectedImage.value = image;
  isModalVisible.value = true;
};

const handleImageError = (image) => {
  failedImages.value.add(image.id);
  console.warn('Failed to load image:', image.publicUrl);
};

const getImageClass = (imageId) => {
  const isActive = draggingImageId.value === imageId && isDragging;
  const isSelected = selectedImageIds.value.has(imageId);

  if (isActive) {
    return 'transform-gpu scale-105 cursor-grabbing select-none';
  }

  return isSelected
    ? 'is-selected transform-gpu transition-transform duration-75 hover:scale-105'
    : 'transform-gpu transition-transform duration-75 hover:scale-105';
};

const getImageStyle = (index) => {
  const image = images.value[index];
  if (!image.position) return {};

  return {
    position: 'absolute',
    left: `${image.position.x}px`,
    top: `${image.position.y}px`,
    width: `${image.width || 120}px`,
    height: `${image.height || 120}px`,
    zIndex: image.position.zIndex || index + 1,
    willChange: (draggingImageId.value === image.id || resizingImageId.value === image.id) ? 'left, top, width, height' : 'auto'
  };
};

const loadUserImages = async () => {
  try {
    isLoadingImages.value = true;

    const response = await fetch(`${API_URL}/images`, {
      headers: {
        'x-access-token': localStorage.getItem('token') || ''
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (errorData.message === 'jwt expired') {
        message.error('Session expired. Please login again.');
        return;
      }
      throw new Error(errorData.message || 'Failed to load images');
    }

    const userImages = await response.json();
    clearSelection();
    images.value = userImages.map((image, index) => {
      const savedPosition = localStorage.getItem(`whiteboard-image-${image.id}-position`);
      const savedSizeRaw = localStorage.getItem(`whiteboard-image-${image.id}-size`);
      const baseSizeRaw = localStorage.getItem(`whiteboard-image-${image.id}-base-size`);
      const savedSize = savedSizeRaw ? JSON.parse(savedSizeRaw) : null;
      const baseSize = baseSizeRaw ? JSON.parse(baseSizeRaw) : null;

      return {
        ...image,
        publicUrl: image.publicUrl || image.url,
        position: savedPosition
          ? JSON.parse(savedPosition)
          : {
              x: (index % 8) * 150 + 20,
              y: Math.floor(index / 8) * 160 + 20,
              zIndex: index + 1
            },
        width: savedSize?.width || image.width || 120,
        height: savedSize?.height || image.height || 120,
        minWidth: baseSize?.width || 120,
        minHeight: baseSize?.height || 120
      };
    });

  } catch (err) {
    console.error('Load images error:', err);
    error.value = err.message;
  } finally {
    isLoadingImages.value = false;
  }
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};


const saveImagePositions = () => {
  images.value.forEach((image) => {
    if (image.position) {
      localStorage.setItem(`whiteboard-image-${image.id}-position`, JSON.stringify(image.position));
    }
  });
};


const resetCursor = (event) => {
  const imageWrapper = event.currentTarget?.closest('[data-whiteboard-image]');
  const imageContainer = event.currentTarget;

  if (imageWrapper) {
    imageWrapper.style.cursor = 'grab';
    imageWrapper.classList.remove('edge-hover');
  }

  if (imageContainer) {
    imageContainer.style.cursor = 'grab';
  }
};

const saveImageSizes = () => {
  images.value.forEach((image) => {
    if (image.width && image.height) {
      localStorage.setItem(`whiteboard-image-${image.id}-size`, JSON.stringify({
        width: image.width,
        height: image.height
      }));
    }
  });
};

onMounted(() => {
  loadUserImages();
  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);
});

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', handleMouseUp);
  if (suppressCanvasClickTimer) {
    window.clearTimeout(suppressCanvasClickTimer);
  }
});

defineExpose({
  refresh: refreshImages,
  clear: clearAllImages
});
</script>

<style scoped>
/* Dense image grid layout */
.flex.flex-wrap {
  margin: -1px; /* Compensate for the 1px gaps we want to eliminate */
}

/* Ensure images fill available space with no gaps */
[data-whiteboard-image] {
  margin: 0;
  padding: 0;
  border-spacing: 0;
}

/* Make sure the container fills all available space */
.w-full.h-full.flex.flex-wrap {
  width: calc(100% + 2px);
  height: calc(100% + 2px);
}

/* Ensure images maintain good visibility */
[data-whiteboard-image] img {
  object-fit: cover;
  min-width: 40px; /* Ensure minimum readable size */
  min-height: 40px;
}

/* Prevent images from becoming too small */
.whiteboard-image-shell {
  min-width: 40px !important;
  min-height: 40px !important;
}
.whiteboard-canvas {
  position: relative;
  min-height: 75vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  background-image:
    radial-gradient(circle at 25px 25px, #cbd5e1 2px, transparent 2px),
    radial-gradient(circle at 75px 75px, #cbd5e1 2px, transparent 2px);
  background-size: 100px 100px;
}

.whiteboard-canvas:hover {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.header-actions-bar {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

:deep(.header-action-btn),
:deep(.image-action-btn) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none !important;
  transition: all 0.2s ease;
}

:deep(.header-action-btn) {
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 999px !important;
  background: transparent !important;
  color: #64748b !important;
  box-shadow: none !important;
}

:deep(.header-action-btn .anticon) {
  font-size: 16px;
}

:deep(.header-action-btn:hover),
:deep(.header-action-btn:focus) {
  transform: translateY(-1px);
  background: transparent !important;
  box-shadow: none !important;
}

:deep(.header-action-btn--neutral) {
  color: #ffffff !important;
  opacity: 0.72;
}

:deep(.header-action-btn--neutral:hover),
:deep(.header-action-btn--neutral:focus) {
  color: #ffffff !important;
  opacity: 1;
}

:deep(.header-action-btn--danger) {
  color: #ffffff !important;
  opacity: 0.72;
}

:deep(.header-action-btn--danger:hover),
:deep(.header-action-btn--danger:focus) {
  color: #ffffff !important;
  opacity: 1;
}

:deep(.image-action-btn) {
  width: 28px;
  height: 28px;
  background: rgba(15, 23, 42, 0.68) !important;
  color: #f8fafc !important;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.20);
  backdrop-filter: blur(10px);
}

:deep(.image-action-btn .anticon) {
  font-size: 12px;
}

:deep(.image-action-btn:hover),
:deep(.image-action-btn:focus) {
  transform: translateY(-1px) scale(1.04);
}

:deep(.image-action-btn--primary:hover),
:deep(.image-action-btn--primary:focus) {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.92) 0%, rgba(59, 130, 246, 0.92) 100%) !important;
  color: #ffffff !important;
}

:deep(.image-action-btn--neutral:hover),
:deep(.image-action-btn--neutral:focus) {
  background: linear-gradient(135deg, rgba(71, 85, 105, 0.92) 0%, rgba(30, 41, 59, 0.92) 100%) !important;
  color: #ffffff !important;
}

:deep(.image-action-btn--danger:hover),
:deep(.image-action-btn--danger:focus) {
  background: linear-gradient(135deg, rgba(244, 63, 94, 0.94) 0%, rgba(225, 29, 72, 0.94) 100%) !important;
  color: #ffffff !important;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Enhanced cursor feedback for resize areas */
[data-whiteboard-image] {
  cursor: grab;
  /* Ensure cursor changes work properly */
  pointer-events: auto;
}

[data-whiteboard-image]:active {
  cursor: grabbing;
}

/* Show resize cursor when hovering over resizable edges */
[data-whiteboard-image].edge-hover {
  /* Add visual indicator that this area is interactive */
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

[data-whiteboard-image].is-selected .whiteboard-image-shell {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.25);
}

/* Debug class for easier testing */
.edge-hover-target:hover {
  position: relative;
}

.edge-hover-target::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border: 1px solid transparent;
  pointer-events: none;
}

.edge-hover-target:hover::before {
  border-color: rgba(59, 130, 246, 0.2);
}
</style>