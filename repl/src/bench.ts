import bench from "highlvl-benchmark"

function range(n: number) {
  const arr = []
  for (let i = 0; i < n; i++) {
    arr.push(i)
  }
  return arr
}

bench(1000)(
  function inline() {
    return () => {
      for (let i = 0; i < 10 ** 8; i++) {
      
      }
    }
  },
  function ahead() {
    return () => {
      const until = 10 ** 8
      for (let i = 0; i < until; i++) {
      
      }
    }
  },
  function rangeo() {
    return () => {
      for (const i of range(10 ** 2)) {
        // console.log(i)
      }
    }
  }
)


