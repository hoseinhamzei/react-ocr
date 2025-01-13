import { HandWriteInput, ImageInput } from "./components"

function App() {

  function handleDetect(detectedText: string){
    console.log(detectedText);
  }

  return (
    <>
      <div>
        <HandWriteInput onDetect={handleDetect} />
        <hr />
        <ImageInput onDetect={handleDetect} />
      </div>
    </>
  )
}

export default App
