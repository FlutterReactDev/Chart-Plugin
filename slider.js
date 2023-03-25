
const WIDTH = window.innerWidth/2
const HEIGHT = 80
const DPI_WIDTH = WIDTH * 2
const DPI_HEIGHT = HEIGHT * 2
const VIEW_HEIGHT = DPI_HEIGHT 
const VIEW_WIDTH  = DPI_WIDTH
const DEFAULT_WIDTH = WIDTH * 0.3
const MIN_WIDTH = WIDTH * 0.1

export default function slider(root,data,changeMainCanvas) {
    root.style.width = WIDTH + 'px'
    root.style.height = HEIGHT + 'px'
    root.width = DPI_WIDTH
    root.height = DPI_HEIGHT
    const ctx = root.getContext("2d")
   
    const $window = document.querySelector('[data-el="window"]')
    const $left = document.querySelector('[data-el="left"]')
    const $right = document.querySelector('[data-el="right"]')
    const $leftResizer = document.querySelector('[data-type="left"]')
    const $rightResizer = document.querySelector('[data-type="right"]')
    $window.style.width = DEFAULT_WIDTH + 'px'
    setPosition(0,WIDTH-DEFAULT_WIDTH)
    
    $window.addEventListener('mousedown',function(e)  {
        const dimensions = {
            left:parseInt($left.style.width) || 0,
            right:parseInt($right.style.width) || 0,
            width:parseInt($window.style.width) || 0
        }

        const startX = e.pageX

        document.onmousemove = function(e) {
            const delta = startX - e.pageX
            if(delta == 0) {
                return
            }

            const left = dimensions.left - delta
            const right = WIDTH - left - dimensions.width

            if(left < 0) {
                $window.style.left = 0 + 'px'
                $left.style.width = 0 + 'px'
                return 
            }
    
            if(right < 0) {
                $window.style.right = 0 + 'px'
                $right.style.width = 0 + 'px'
                return 
            }   

            $window.style.left = left + 'px'
            $window.style.right = right + 'px'

            $left.style.width = left + 'px'
            $right.style.width = right +'px'
            changeMainCanvas()
        }

    })
    $leftResizer.addEventListener('mousedown',function(e) {
        const startX = e.pageX
        const lastElementPoints = {
            left:parseInt($left.style.width) || 0,
            right:parseInt($right.style.width) || 0,
            width:parseInt($window.style.width) || 0
        }
        document.onmousemove = function(e) {
            const delta = startX- e.pageX

            if(delta == 0) {
                return
            }

            const left = WIDTH - (lastElementPoints.width + delta) - lastElementPoints.right
            const right = WIDTH - (lastElementPoints.width + delta) - left

            setPosition(left,right)

            changeMainCanvas()
        }
    
    })
    $rightResizer.addEventListener('mousedown',function(e) {
        const startX = e.pageX
        const lastElementPoints = {
            left:parseInt($left.style.width) || 0,
            right:parseInt($right.style.width) || 0,
            width:parseInt($window.style.width) || 0
        }
        document.onmousemove = function(e) {
            const delta = startX - e.pageX
        
            if(delta == 0) {
                return
            }
            
           const right = (WIDTH - (lastElementPoints.width) + delta) -lastElementPoints.left
           setPosition(lastElementPoints.left,right)
           changeMainCanvas()
        }
       
    })

    function setPosition(left,right) {
        const w = WIDTH - left - right

        if(w < MIN_WIDTH) {
          $window.style.width = MIN_WIDTH + 'px'
           return
        }



        if(left < 0) {
            $window.style.left = 0 + 'px'
            $left.style.width = 0 + 'px'
            return 
        }

        if(right < 0) {
            $window.style.right = 0 + 'px'
            $right.style.width = 0 + 'px'
            return 
        }


        $window.style.width = w + 'px'
        $window.style.left = left + 'px'
        $window.style.right = right + 'px'

        $left.style.width = left + 'px'
        $right.style.width = right +'px'
 
       
    }

    function changePositions() {
        const lastElementPoints = {
            left:parseInt($left.style.width) || 0,
            right:parseInt($right.style.width) || 0,
            width:parseInt($window.style.width) || 0
        }

        const range = WIDTH - lastElementPoints.left - lastElementPoints.right
        const left = WIDTH - lastElementPoints.right - lastElementPoints.width
        const right = WIDTH - lastElementPoints.right - lastElementPoints.width
        const leftRatio = (left * 100) / WIDTH
        const rightRatio = (right * 100) / WIDTH
        const window = (range * 100) / WIDTH


        return [Math.floor(leftRatio), Math.floor(window + rightRatio)]
    }

    document.addEventListener("mouseup",function() {
        document.onmousemove = null
    })
    
    function paint( ) {
        const [yMin,yMax] = computeBoundaries(data)
        const yRatio = VIEW_HEIGHT / (yMax) 
        const xRatio = VIEW_WIDTH / (data.columns[0].length-2)
        createLines(ctx, data,xRatio,yRatio,DPI_HEIGHT)
    }

    paint()


    return {
        change: changePositions
    }
}
 
function createLines(ctx,data,xRatio,yRatio,DPI_HEIGHT) {
    const linePositions = []
    
    const lines = getLineData(data,xRatio,yRatio,DPI_HEIGHT)
    
    for(let i = 0; i < lines.length;i++) {
        const map = new Map()
        ctx.beginPath()
        ctx.lineWidth = 4
        ctx.strokeStyle = lines[i].color
        map.set("color",lines[i].color)
        for(const [x,y] of lines[i].coords) {
            map.set(x,y)
           
            ctx.lineTo(x,y)
        }
        linePositions.push(map)
        ctx.stroke()
        ctx.closePath()
    }

    return linePositions
   
}
function getLineData({columns,colors},xRatio,yRatio,DPI_HEIGHT) {
    const lineData = []
    const data = columns.slice(1)

    for(let i = 0; i < data.length;i++) {
        lineData.push({
            color:colors[data[i][0]],
            coords:createCoords(data[i].slice(1),xRatio,yRatio)
        })
    }

    function createCoords(data,xRatio,yRatio) {
        return data.map((y,i) => [Math.floor(i*xRatio),Math.floor(DPI_HEIGHT-y*yRatio)])
    }
    return lineData
}

function computeBoundaries({columns,types}) {
    const data = [...columns.slice(1)]
    const cols = [...data[0].slice(1),...data[1].slice(1)]

    return [Math.min(...cols), Math.max(...cols)]
  
}


