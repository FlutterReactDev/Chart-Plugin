import getChartData from "./data";
import slider from "./slider";
import "./style.css";

const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight / 2;
const DPI_WIDTH = WIDTH * 2;
const DPI_HEIGHT = HEIGHT * 2;
const PADDING = 40;
const VIEW_HEIGHT = DPI_HEIGHT - PADDING * 2;
const VIEW_WIDTH = DPI_WIDTH;
const ROWS_COUNT = 5;

function chart(root, telegramData) {
  const ctx = root.getContext("2d");
  const $checkbox = document.querySelector(".toggle-checkbox");
  const checkboxLines = getLinesName(telegramData);
  let availableLines = [...checkboxLines];
  let data = telegramData;
  const sl = slider(
    document.getElementById("slider"),
    telegramData,
    paint,
  );
  const mouse = {
    x: 0,
  };
  root.style.width = WIDTH + "px";
  root.style.height = HEIGHT + "px";
  root.width = DPI_WIDTH;
  root.height = DPI_HEIGHT;

  root.addEventListener("mousemove", function ({ clientX }) {
    mouse.x = Math.floor((clientX - root.getBoundingClientRect().left) * 2);
    paint();
  });

  root.addEventListener("mouseleave", function () {
    mouse.x = 0;
    paint();
  });

  function paint() {
    const [from, to] = sl.change();
    data = rangeData(from, to, telegramData);

    const [yMin, yMax] = computeBoundaries(data);
    const yRatio = VIEW_HEIGHT / yMax;
    const xRatio = VIEW_WIDTH / (data.columns[0].length - 2);
    ctx.clearRect(0, 0, DPI_WIDTH, DPI_HEIGHT);
    yAxis(yMin, yMax);
    const positionLine = createLines(
      ctx,
      data,
      xRatio,
      yRatio,
      DPI_HEIGHT,
      PADDING,
      availableLines
    );
    xAxis(ctx, xRatio, positionLine);
  }

  paint();
  sl.paintSlider(availableLines)
  createCheckbox(telegramData);

  const toggleLines = document.querySelectorAll(".line-toggle");

  toggleLines.forEach((el) =>
    el.addEventListener("change", (e) => {
      const _target = e.target;
      const _id = _target.id;
      if (availableLines.includes(_id)) {
        availableLines = availableLines.filter((line) => line != _id);
      } else {
        availableLines.push(_id);
      }

      paint();
      sl.paintSlider(availableLines);
    })
  );

  function xAxis(ctx, xRatio, positionLine) {
    const pos = lineX(data.columns[0].length, xRatio);

    for (let i = 0; i < positionLine.length; i++) {
      const map = positionLine[i];
      for (let i = 1; i <= pos.length; i++) {
        if (mouse.x > pos[i - 1] && mouse.x < pos[i]) {
          if (Math.floor((pos[i] + pos[i - 1]) / 2) > mouse.x) {
            ctx.beginPath();
            ctx.fillStyle = map.get("color");
            ctx.arc(pos[i - 1], map.get(pos[i - 1]), 10, 0, 2 * Math.PI);
            ctx.fill();
            ctx.closePath();
          }

          if (Math.floor((pos[i] + pos[i - 1]) / 2) < mouse.x) {
            ctx.beginPath();
            ctx.fillStyle = map.get("color");
            ctx.arc(pos[i], map.get(pos[i]), 10, 0, 2 * Math.PI);
            ctx.fill();
            ctx.closePath();
          }
        }
      }
    }
  }

  function yAxis(yMin, yMax) {
    const step = VIEW_HEIGHT / ROWS_COUNT;
    const textStep = Math.floor((yMax - yMin) / ROWS_COUNT);

    ctx.beginPath();
    ctx.strokeStyle = "#bb7";
    ctx.font = "20px Arial";
    ctx.fillStyle = "#ccc";
    ctx.lineWidth = 1;
    for (let i = 1; i <= ROWS_COUNT; i++) {
      const y = step * i;
      const text = yMax - textStep * i;
      ctx.fillText(text, 5, y + PADDING - 10);
      ctx.moveTo(0, y + PADDING);
      ctx.lineTo(DPI_WIDTH, y + PADDING);
    }
    ctx.stroke();
    ctx.closePath();
  }

  function createCheckbox(data) {
    const html = (id, color, checked) => {
      return `
            <div class="line-toggle">
            <input ${checked ? "checked" : ""} type="checkbox" id="${id}" />
            <label for="${id}">
              <div class="line">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="${color}"
                  class="w-6 h-6"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
                  />
                </svg>
              </div>
            </label>
          </div>
            `;
    };

    checkboxLines.forEach((line) => {
      $checkbox.insertAdjacentHTML(
        "beforeend",
        html(line, data.colors[line], availableLines.includes(line))
      );
    });
  }
}

function createLines(
  ctx,
  data,
  xRatio,
  yRatio,
  DPI_HEIGHT,
  PADDING,
  availableLines
) {
  const linePositions = [];

  const lines = getLineData(
    data,
    xRatio,
    yRatio,
    DPI_HEIGHT,
    PADDING,
    availableLines
  );

  for (let i = 0; i < lines.length; i++) {
    const map = new Map();
    ctx.beginPath();
    ctx.lineWidth = 4;
    ctx.strokeStyle = lines[i].color;
    map.set("color", lines[i].color);
    for (const [x, y] of lines[i].coords) {
      map.set(x, y);

      ctx.lineTo(x, y);
    }
    linePositions.push(map);
    ctx.stroke();
    ctx.closePath();
  }

  return linePositions;
}

function getLineData(
  { columns, colors },
  xRatio,
  yRatio,
  DPI_HEIGHT,
  PADDING,
  availableLines = []
) {
  const lineData = [];
  const data = columns.slice(1).filter((lines) => {
    return availableLines.includes(lines[0]);
  });

  for (let i = 0; i < data.length; i++) {
    lineData.push({
      color: colors[data[i][0]],
      coords: createCoords(data[i].slice(1), xRatio, yRatio),
    });
  }

  function createCoords(data, xRatio, yRatio) {
    return data.map((y, i) => [
      Math.floor(i * xRatio),
      Math.floor(DPI_HEIGHT - PADDING - y * yRatio),
    ]);
  }
  return lineData;
}

function lineX(length, xRatio) {
  const position = [];
  for (let i = 0; i < length; i++) {
    const x = Math.floor(i * xRatio);
    position.push(x);
  }
  return position;
}

function computeBoundaries({ columns, types }) {
  const data = [...columns.slice(1)];
  const cols = [...data[0].slice(1), ...data[1].slice(1)];

  return [Math.min(...cols), Math.max(...cols)];
}

function rangeData(from, to, data) {
  const newData = { ...data };
  const lines = data.columns;
  const newColumns = [];
  lines.map((col) => {
    newColumns.push([
      col[0],
      ...col
        .slice(1)
        .slice(((col.length - 1) * from) / 100, ((col.length - 1) * to) / 100),
    ]);
  });
  newData.columns = [...newColumns];

  return newData;
}

function getLinesName(data) {
  const cols = data.columns.slice(1);
  const names = [];
  for (let i = 0; i < cols.length; i++) {
    names.push(cols[i][0]);
  }
  return names;
}
chart(document.getElementById("chart"), getChartData());
