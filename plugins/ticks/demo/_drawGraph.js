const somehow = require('somehow')

const drawGraph = function (ticks, id) {
  const el = document.querySelector(id)
  const w = somehow({
    width: 500,
    height: 20,
  })
  ticks.map((tick) => {
    w.dot().at(tick.value, 1)
  })
  w.y.fit()
  w.x.fit(0, 1)
  w.yAxis.remove()
  // w.xAxis.remove()
  el.innerHTML = w.build()
}
export default drawGraph
