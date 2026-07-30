<template>
  <div
    ref="canvasContainerRef"
    :class="$props.class"
    aria-hidden="true"
  >
    <canvas ref="canvasRef"></canvas>
  </div>
</template>

<script setup lang="ts">
import { useDevicePixelRatio } from "@vueuse/core";
import { ref, onMounted, onBeforeUnmount, computed } from "vue";

type Circle = {
  x: number;
  y: number;
  size: number;
  alpha: number;
  targetAlpha: number;
  dx: number;
  dy: number;
};

type Props = {
  color?: string;
  quantity?: number;
  staticity?: number;
  ease?: number;
  class?: string;
};

const props = withDefaults(defineProps<Props>(), {
  color: "#FFF",
  quantity: 100,
  staticity: 50,
  ease: 50,
  class: "",
});

const canvasRef = ref<HTMLCanvasElement | null>(null);
const canvasContainerRef = ref<HTMLDivElement | null>(null);
const context = ref<CanvasRenderingContext2D | null>(null);
const { pixelRatio } = useDevicePixelRatio();

// Plain JS data structures to avoid reactive system overhead in 60fps loop
const circles: Circle[] = [];
const canvasSize = { w: 0, h: 0 };
let animationFrameId: number | null = null;

const color = computed(() => {
  let hex = props.color.replace(/^#/, "");

  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((char) => char + char)
      .join("");
  }

  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `${r}, ${g}, ${b}`;
});

onMounted(() => {
  if (canvasRef.value) {
    context.value = canvasRef.value.getContext("2d");
  }

  initCanvas();
  animate();
  window.addEventListener("resize", initCanvas);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", initCanvas);
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
  }
});

function initCanvas() {
  resizeCanvas();
  drawParticles();
}

function resizeCanvas() {
  if (canvasContainerRef.value && canvasRef.value && context.value) {
    circles.length = 0;
    canvasSize.w = canvasContainerRef.value.offsetWidth;
    canvasSize.h = canvasContainerRef.value.offsetHeight;
    canvasRef.value.width = canvasSize.w * pixelRatio.value;
    canvasRef.value.height = canvasSize.h * pixelRatio.value;
    canvasRef.value.style.width = canvasSize.w + "px";
    canvasRef.value.style.height = canvasSize.h + "px";
    context.value.scale(pixelRatio.value, pixelRatio.value);
  }
}

function circleParams(): Circle {
  const x = Math.floor(Math.random() * canvasSize.w);
  const y = Math.floor(Math.random() * canvasSize.h);
  const size = Math.floor(Math.random() * 2) + 1;
  const alpha = 0;
  const targetAlpha = parseFloat((Math.random() * 0.6 + 0.1).toFixed(1));
  const dx = (Math.random() - 0.5) * 0.2;
  const dy = (Math.random() - 0.5) * 0.2;
  return {
    x,
    y,
    size,
    alpha,
    targetAlpha,
    dx,
    dy,
  };
}

function drawCircle(circle: Circle, update = false) {
  if (context.value) {
    const { x, y, size, alpha } = circle;
    context.value.beginPath();
    context.value.arc(x, y, size, 0, 2 * Math.PI);
    context.value.fillStyle = `rgba(${color.value}, ${alpha})`;
    context.value.fill();

    if (!update) {
      circles.push(circle);
    }
  }
}

function clearContext() {
  if (context.value) {
    context.value.clearRect(0, 0, canvasSize.w, canvasSize.h);
  }
}

function drawParticles() {
  clearContext();
  const particleCount = props.quantity;
  for (let i = 0; i < particleCount; i++) {
    const circle = circleParams();
    drawCircle(circle);
  }
}

function remapValue(
  value: number,
  start1: number,
  end1: number,
  start2: number,
  end2: number,
): number {
  const remapped = ((value - start1) * (end2 - start2)) / (end1 - start1) + start2;
  return remapped > 0 ? remapped : 0;
}

function animate() {
  clearContext();
  const w = canvasSize.w;
  const h = canvasSize.h;
  
  for (let i = 0; i < circles.length; i++) {
    const circle = circles[i];

    // Handle the alpha value based on edge proximity
    const edge = [
      circle.x - circle.size, // distance from left edge
      w - circle.x - circle.size, // distance from right edge
      circle.y - circle.size, // distance from top edge
      h - circle.y - circle.size, // distance from bottom edge
    ];

    const closestEdge = Math.min(...edge);
    const remapClosestEdge = parseFloat(remapValue(closestEdge, 0, 20, 0, 1).toFixed(2));

    if (remapClosestEdge > 1) {
      circle.alpha += 0.02;
      if (circle.alpha > circle.targetAlpha) circle.alpha = circle.targetAlpha;
    } else {
      circle.alpha = circle.targetAlpha * remapClosestEdge;
    }

    circle.x += circle.dx;
    circle.y += circle.dy;

    // Check if circle is out of canvas bounds
    if (
      circle.x < -circle.size ||
      circle.x > w + circle.size ||
      circle.y < -circle.size ||
      circle.y > h + circle.size
    ) {
      // Replace the out-of-bounds circle with a new one directly
      circles[i] = circleParams();
    } else {
      drawCircle(circle, true);
    }
  }
  animationFrameId = window.requestAnimationFrame(animate);
}
</script>