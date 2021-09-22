import "./App.css";
import logo from "./front2.jpg";
import side from "./side.jpg";
import * as bodypix from "@tensorflow-models/body-pix";
import * as _tfjs from "@tensorflow/tfjs";
import { find, indexOf, lastIndexOf } from "lodash";

const HEIGHT = 175;
const CHEST_TO_SHOULDER = 15;
const SEGMENTATION_THRESHOLD = 0.75;

function App() {
  const getCircumference = (chestStraight, chestDepth) => {
    const a = chestStraight / 2,
      b = chestDepth / 2;
    const aPlusB = a + b;
    const aMinusB = a - b;
    const aPlusBSqr = aPlusB * aPlusB;
    const aMinusBSqr = aMinusB * aMinusB;
    const root = Math.sqrt(-3 * (aMinusBSqr / aPlusBSqr) + 4) + 10;
    const deno = root * aPlusBSqr;
    const inner = 3 * (aMinusBSqr / deno) + 1;
    const circumference = 3.14 * aPlusB * inner;
    return circumference;
  };

  const getFrontSegmentation = async () => {
    let img = document.getElementById("uncle");
    let sideImg = document.getElementById("sid");
    const canvas_front = document.getElementById("front_canvas");
    const canvas_side = document.getElementById("side_canvas");
    const ctx_front = canvas_front.getContext("2d");
    const model = await bodypix.load({
      architecture: "ResNet50",
      outputStride: 16,
      multiplier: 1,
      quantBytes: 4,
    });
    const frontSegments = await model.segmentPersonParts(img, {
      segmentationThreshold: SEGMENTATION_THRESHOLD,
    });

    const front_mask = bodypix.toColoredPartMask(frontSegments);
    bodypix.drawMask(canvas_front, img, front_mask);
    console.log(frontSegments);

    const pixelArray = frontSegments.data;
    const leftShoulderPosition = find(
      frontSegments.allPoses[0].keypoints,
      (points) => points.part === "leftShoulder"
    ).position;

    ctx_front.arc(leftShoulderPosition.x, leftShoulderPosition.y, 2, 0, 360);
    ctx_front.fill();

    const fristLeftFacePixel = indexOf(pixelArray, 0);
    const topRow = fristLeftFacePixel / frontSegments.width;
    const lastLeftFootPixel = lastIndexOf(pixelArray, 23);
    const bottomRow = lastLeftFootPixel / frontSegments.width;
    const lengthToPixel = (bottomRow - topRow) / HEIGHT;
    console.log(lengthToPixel);
    const chestLevel = Math.floor(CHEST_TO_SHOULDER * lengthToPixel + leftShoulderPosition.y);

    ctx_front.arc(leftShoulderPosition.x, chestLevel, 2, 0, 360);
    ctx_front.fill();

    const chestRowFirstPixel = frontSegments.width * chestLevel;
    console.log("CHEST: ", chestLevel, chestRowFirstPixel);

    const chestRowPixels = frontSegments.data.slice(
      chestRowFirstPixel,
      chestRowFirstPixel + frontSegments.width
    );
    console.log(chestRowPixels);
    const chestLegthStart = indexOf(chestRowPixels, 12);
    const chestLegthEnd = lastIndexOf(chestRowPixels, 12);
    ctx_front.moveTo(chestLegthStart, chestLevel);
    ctx_front.lineTo(chestLegthEnd, chestLevel);
    ctx_front.stroke();
    console.log(
      chestLegthStart,
      chestLegthEnd,
      chestLegthEnd - chestLegthStart,
      (chestLegthEnd - chestLegthStart) / lengthToPixel
    );
    const chestStraight = (chestLegthEnd - chestLegthStart) / lengthToPixel;
    // SECTION: segment side image
    const sideSegments = await model.segmentPersonParts(sideImg, {
      segmentationThreshold: SEGMENTATION_THRESHOLD,
    });

    const side_mask = bodypix.toColoredPartMask(sideSegments);
    bodypix.drawMask(canvas_side, sideImg, side_mask);

    const sidePixelArray = sideSegments.data;
    const sideLeftShoulderPosition = find(
      sideSegments.allPoses[0].keypoints,
      (points) => points.part === "leftShoulder"
    ).position;
    const firstSideFacePixel = indexOf(sidePixelArray, 0);
    const sideTopRow = firstSideFacePixel / sideSegments.width;
    const lastSideLeftFootPixel = lastIndexOf(sidePixelArray, 23);
    const bottomSideRow = lastSideLeftFootPixel / sideSegments.width;
    const lengthToPixelSide = (bottomSideRow - sideTopRow) / HEIGHT;

    const sideChestLevel = Math.floor(
      CHEST_TO_SHOULDER * lengthToPixelSide + sideLeftShoulderPosition.y
    );

    const chestSideRowFirstPixel = sideSegments.width * sideChestLevel;
    console.log("CHEST: ", chestLevel, chestRowFirstPixel);

    const chestSideRowPixels = sideSegments.data.slice(
      chestSideRowFirstPixel,
      chestSideRowFirstPixel + sideSegments.width
    );
    console.log(chestRowPixels);
    const chestSideLegthStart = indexOf(chestSideRowPixels, 12);
    const chestSideLegthEnd = lastIndexOf(chestSideRowPixels, 13);
    console.log(
      "SIDE",
      chestSideLegthStart,
      chestSideLegthEnd,
      chestSideLegthEnd - chestSideLegthStart,
      (chestSideLegthEnd - chestSideLegthStart) / lengthToPixelSide
    );
    const chestDepth = (chestSideLegthEnd - chestSideLegthStart) / lengthToPixelSide;

    const chestCircumference = getCircumference(chestStraight, chestDepth);
    alert(`Chest circumference: ${Math.floor(chestCircumference)} cm`);
  };
  return (
    <div className="App">
      <header className="App-header">
        <button onClick={() => getFrontSegmentation()}>
          <p>Predict</p>
        </button>
        <div style={{ display: "flex" }}>
          <img
            id="uncle"
            src={logo}
            alt=""
            style={{ flex: 1, objectFit: "contain", width: "50%" }}
          />
          <img id="sid" src={side} alt="" style={{ flex: 1, objectFit: "contain", width: "50%" }} />
        </div>
        <div>
          <canvas id="front_canvas" style={{ width: "50%" }} />
          <canvas id="side_canvas" style={{ width: "50%" }} />
        </div>
      </header>
    </div>
  );
}

export default App;
