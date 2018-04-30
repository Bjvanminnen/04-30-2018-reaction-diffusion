// Copied from : https://codepen.io/worldofstem/pen/xbLZKG
import $ from 'jquery';

function invariant(assertion, msg) {
  if (!assertion) {
    throw new Error(msg);
  }
}

// Create a 2D array
function createArray(dimX, dimY) {
  var array = new Array(dimX);
  for (var i = 0; i < dimX; i++) {
    array[i] = new Array(dimY);
  }
  return array;
};

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
};

function mix(x, y, a) {
  return x * (1 - a) + y * a;
}

export default function draw() {

  // get canvas drawing context
  var canvas = document.getElementById("maincanvas");
  var context = canvas.getContext('2d');

  // dimensions of simulation grid are taken from canvas
  var dimX = canvas.offsetWidth;
  var dimY = canvas.offsetHeight;

  // get the pixel data from the canvas for faster rendering
  var pixelData = context.getImageData(0, 0, dimX, dimY);

  // variables to handle the start/stop/reset state of the simulation
  var isRunning = false;
  var theSim = null;
  var currentCount = 0;
  var dt = 20;


  // function to perform an iteration of the algorithm, draw
  // the results and schedule another iteration
  var updateAndDraw = function()
  {
    theSim.updateAndDraw();

    currentCount++;
    $('#counter').html(currentCount);

    if (isRunning) {
      setTimeout(function() { updateAndDraw(); }, dt);
    }
  };

  var reset = function()
  {
    theSim.reset();
    currentCount = 0;
  };

  // add button handlers
  $('#startstop').click(function() {
    if (!isRunning) {
      isRunning = true;
      updateAndDraw();
    }
    else {
      isRunning = false;
    }
  });

  $('#reset').click(reset);

  // main class for the simulation data and algorithm
  function Simulation() {
    // arrays for the values of A, B and C
    var a = [createArray(dimX, dimY), createArray(dimX, dimY)];
    var b = [createArray(dimX, dimY), createArray(dimX, dimY)];
    var c = [createArray(dimX, dimY), createArray(dimX, dimY)];

    // the above arrays connsist of 2 buffers that are
    // flipped over after each iteration - one buffer contains
    // the input data to the algorithm and the other contains
    // the output at the end of the iteration
    var readBuffer = 0;
    var writeBuffer = 1;
    var resetOnNextDraw = false;

    this.reset = () => resetOnNextDraw = true;

    // Fill our read buffers (a,b,c) with random values
    function doReset () {
      for (var x = 0; x < dimX; x++) {
        for (var y = 0; y < dimY; y++) {
          a[readBuffer][x][y] = x < 50 ? 1 : 0; //Math.random();
          b[readBuffer][x][y] = y < 50 ? 1 : 0; //Math.random();
          c[readBuffer][x][y] = x + y > 100 ? 1 : 0;
        }
      }
    };

    // function to perform 1 iteration of the algorithm and render the results to canvas
    this.updateAndDraw = function() {
      if (resetOnNextDraw) {
        doReset();
        resetOnNextDraw = false;
      }

      var aRead = a[readBuffer];
      var bRead = b[readBuffer];
      var cRead = c[readBuffer];

      var aWrite = a[writeBuffer];
      var bWrite = b[writeBuffer];
      var cWrite = c[writeBuffer];

      const pixelArray = pixelData.data;

      let sum = 0;

      for (let x = 0; x < dimX; x++) {
        const xMinus = (x + dimX - 1) % dimX;
        const xPlus = (x + 1) % dimX;

        var aReadxMinus = aRead[xMinus];
        var bReadxMinus = bRead[xMinus];
        var cReadxMinus = cRead[xMinus];
        var aReadx = aRead[x];
        var bReadx = bRead[x];
        var cReadx = cRead[x];
        var aReadxPlus = aRead[xPlus];
        var bReadxPlus = bRead[xPlus];
        var cReadxPlus = cRead[xPlus];

        for (let y = 0; y < dimY; y++) {
          const yMinus = (y + dimY - 1) % dimY;
          const yPlus = (y + 1) % dimY;

          let aVal = aReadxMinus[yMinus]
               + aReadxMinus[y]
               + aReadxMinus[yPlus]
               + aReadx[yMinus]
               + aReadx[y]
               + aReadx[yPlus]
               + aReadxPlus[yMinus]
               + aReadxPlus[y]
               + aReadxPlus[yPlus];

          let bVal = bReadxMinus[yMinus]
               + bReadxMinus[y]
               + bReadxMinus[yPlus]
               + bReadx[yMinus]
               + bReadx[y]
               + bReadx[yPlus]
               + bReadxPlus[yMinus]
               + bReadxPlus[y]
               + bReadxPlus[yPlus];

          let cVal = cReadxMinus[yMinus]
               + cReadxMinus[y]
               + cReadxMinus[yPlus]
               + cReadx[yMinus]
               + cReadx[y]
               + cReadx[yPlus]
               + cReadxPlus[yMinus]
               + cReadxPlus[y]
               + cReadxPlus[yPlus];

          aVal *= 0.111111111;
          bVal *= 0.111111111;
          cVal *= 0.111111111;

          // a,b,c val are the average of the three points
          const alpha = 1;
          const beta = 1;
          const gamma = 1;

          const aValNew = clamp(aVal + aVal * (alpha * bVal - gamma * cVal), 0, 1);
          const bValNew = clamp(bVal + bVal * (beta * cVal - alpha * aVal), 0, 1);
          const cValNew = clamp(cVal + cVal * (gamma * aVal - beta * bVal), 0, 1);

          aWrite[x][y] = aValNew;
          bWrite[x][y] = bValNew;
          cWrite[x][y] = cValNew;

          const pixelIndex = (y * dimX + x) * 4;

          // var r1 = 32, g1 = 34, b1 = 35;
          // var r2 = 81, g2 = 226, b2 = 65;

          pixelArray[pixelIndex + 0] = Math.floor(255 * aValNew);//Math.floor(mix(r1, r2, aValNew));
          pixelArray[pixelIndex + 1] = Math.floor(255 * bValNew);//Math.floor(mix(g1, g2, aValNew));
          pixelArray[pixelIndex + 2] = Math.floor(255 * cValNew);//Math.floor(mix(b1, b2, aValNew));
          pixelArray[pixelIndex + 3] = 255;

          sum += aValNew + bValNew + cValNew;
        }
      }

      // console.log(pixelData);
      // window.canvasPixels = pixelData;
      // $('#startstop').click();

      // if (currentCount % 100 === 0) {
        context.putImageData(pixelData, 0, 0);
      // }
      // console.log(sum);

      // Swap buffers
      writeBuffer = readBuffer;
      readBuffer = (readBuffer + 1) % 2;
    };

    doReset();
  };

  theSim = new Simulation(dimX, dimY);
  $('#startstop').click();
}
