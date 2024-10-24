interface CustomCanvasRenderingContext2D extends CanvasRenderingContext2D {
  roundRect: (
    x: number,
    y: number,
    w: number,
    h: number,
    radius: number
  ) => void;
}

export const calculateBarData = (
  frequencyData: Uint8Array,
  width: number,
  barWidth: number,
  gap: number
): number[] => {
  let units = width / (barWidth + gap);
  let step = Math.floor(frequencyData.length / units);

  if (units > frequencyData.length) {
    units = frequencyData.length;
    step = 1;
  }

  const data: number[] = [];

  for (let i = 0; i < units; i++) {
    let sum = 0;

    for (let j = 0; j < step && i * step + j < frequencyData.length; j++) {
      sum += frequencyData[i * step + j];
    }
    data.push(sum / step);
  }
  return data;
};

export const draw = (
  data: number[],
  canvas: HTMLCanvasElement,
  barWidth: number,
  gap: number,
  backgroundColor: string,
  barColor: string
): void => {
  const amp = canvas.height / 2;

  const ctx = canvas.getContext("2d") as CustomCanvasRenderingContext2D;
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (backgroundColor !== "transparent") {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  data.forEach((dp, i) => {
    ctx.fillStyle = barColor;

    const x = i * (barWidth + gap);
    const y = amp - dp / 2;
    const w = barWidth;
    const h = dp || 1;

    ctx.beginPath();
    if (ctx.roundRect) {
      // making sure roundRect is supported by the browser
      ctx.roundRect(x, y, w, h, 50);
      ctx.fill();
    } else {
      // fallback for browsers that do not support roundRect
      ctx.fillRect(x, y, w, h);
    }
  });
};


const settings = {
    gridRows: 30,           
    gridCols: 40,           
    numFrames: 80,          // Total frames for the sequence
    frameDelay: 150,        // Delay in milliseconds between frames
    backgroundColor: 'transparent',  // Background color for canvas 
    //boxColor: 'lightblue',           // Color for filled boxes
    boxColor: 'hsl(195, 53%, 80%)',
    gridlineColor:'lightgrey'        // Color for gridlines
};


// Alternative function to generate grid data with a smoothly looping rotating swirl pattern
function generateGridFramesWithSmoothSwirl(settings) {
    const frames = [];
    const { gridRows, gridCols, numFrames } = settings;

    // Center of the grid for swirl calculation
    const centerX = gridCols / 2;
    const centerY = gridRows / 2;

    // Define the total angle for a full loop
    const totalRotation = 2 * Math.PI; // Full circle rotation

    for (let frame = 0; frame < numFrames; frame++) {
        let frameData = Array.from({ length: gridRows }, () => 
            Array.from({ length: gridCols }, () => ({ fill: false, color: settings.backgroundColor }))
        );

        // Calculate the rotation angle for this frame
        const angleOffset = (frame / numFrames) * totalRotation;

        // Swirl pattern calculation
        for (let row = 0; row < gridRows; row++) {
            for (let col = 0; col < gridCols; col++) {
                // Calculate distance from the center
                const dx = col - centerX;
                const dy = row - centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Calculate angle with rotation over time
                const angle = Math.atan2(dy, dx) + angleOffset;

                // Swirl condition: fill boxes based on distance and angle
                if (Math.sin(angle + distance * 0.5) > 0) {
                    frameData[row][col].fill = true;

                    // Vary intensity from 80% to 50%
                    const intensity = 80 - ((distance / Math.max(gridRows, gridCols)) * 30);
                    //frameData[row][col].color = `hsl(220, 50%, ${intensity}%)`; // Fixed hue, varying intensity
		    frameData[row][col].color = `hsl(195, 53%, ${intensity}%)`; // Lightblue, #ADD8E6 => 195°, 53%, 79%
                }
            }
        }

        frames.push(frameData);
    }

    return frames;
}


let lastFrameTime = 0;
let currentFrame = 0;

let gridFrames = null;

export const drawGrid = (
    timestamp: number,
    canvas: HTMLCanvasElement,
    barWidth: number,
    gap: number,
    backgroundColor: string,
    boxColor: string
): void => {

    if (gridFrames == null) {
	settings.backgroundColor = backgroundColor;
	settings.boxColor = boxColor;
	gridFrames = generateGridFramesWithSmoothSwirl(settings);
    }
    
    if (timestamp - lastFrameTime >= settings.frameDelay) {
        // Get the current frame of grid data
        const gridData = gridFrames[currentFrame];
    
	const amp = canvas.height / 2;

	const ctx = canvas.getContext("2d") as CustomCanvasRenderingContext2D;
	if (!ctx) return;

	ctx.clearRect(0, 0, canvas.width, canvas.height);

	if (backgroundColor !== "transparent") {
	    ctx.fillStyle = backgroundColor;
	    ctx.fillRect(0, 0, canvas.width, canvas.height);
	}

	// Set up drawing parameters
	const boxWidth = canvas.width / settings.gridCols;
	const boxHeight = canvas.height / settings.gridRows;

	// Draw the grid
	for (let row=0; row<settings.gridRows; row++) {
            for (let col=0; col<settings.gridCols; col++) {
		const { fill, color } = gridData[row][col];
		
		if (fill) {
                    ctx.fillStyle = color;
                    ctx.fillRect(col * boxWidth, row * boxHeight, boxWidth - 2, boxHeight - 2);
		} else {
                    ctx.strokeStyle = settings.gridlineColor;
                    ctx.strokeRect(col * boxWidth, row * boxHeight, boxWidth, boxHeight);
		}
            }
	}

	// Move to the next frame
        currentFrame = (currentFrame + 1) % gridFrames.length;
	
        // Update the last frame time
        lastFrameTime = timestamp;
    }	
};
