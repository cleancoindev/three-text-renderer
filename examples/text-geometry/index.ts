import TextRenderer from '../../src/index'
import BarlowBold from '../fonts/Barlow-Bold.ttf'
import ScheherazadeBold from '../fonts/Scheherazade-Bold.ttf'

import { TextDirection, TextOptions } from '../../src/TextOptions'
import {
  Scene,
  OrthographicCamera,
  Mesh,
  WebGLRenderer,
  MeshBasicMaterial,
  DoubleSide,
  Box3Helper,
  Color,
  Vector3,
  PlaneBufferGeometry
} from 'three'
import TextEditor from '../common/TextEditor'
import Ruler, { RulerDirection } from '../contour-extractor/Ruler'

const canvas = document.querySelector('canvas#viewport')! as HTMLCanvasElement
const rulerHorizontal = new Ruler(
  'canvas.ruler.ruler-horizontal',
  RulerDirection.Horizontal
)
const rulerVertical = new Ruler(
  'canvas.ruler.ruler-vertical',
  RulerDirection.Vertical
)

async function main() {
  const textRenderer = new TextRenderer()

  textRenderer.addFont('Barlow-Bold', BarlowBold)
  textRenderer.addFont('Scheherazade-Bold', ScheherazadeBold)

  const textEditor = new TextEditor(textRenderer)
  textEditor.onUpdate(update)

  rulerHorizontal.canvas.addEventListener('click', ev => {
    textEditor.maxWidth = (ev as any).layerX

    update()
  })

  rulerVertical.canvas.addEventListener('click', ev => {
    textEditor.maxHeight = (ev as any).layerY

    update()
  })

  const scene = new Scene()
  const renderer = new WebGLRenderer({ canvas })
  renderer.setClearColor(0xcccccc)
  const camera = new OrthographicCamera(1, 1, 1, 1)
  camera.position.z = 5
  scene.add(camera)

  function handleResize() {
    const { innerWidth, innerHeight } = window
    const width = innerWidth - 30
    const height = innerHeight - 30

    renderer.setSize(width, height)
    camera.left = width / -2
    camera.right = width / 2
    camera.top = height / -2
    camera.bottom = height / 2
    camera.near = -1000
    camera.far = 1000

    camera.updateProjectionMatrix()

    //camera.position.x = textEditor.maxWidth / 2
    //camera.position.y = textEditor.maxHeight / 2
  }

  handleResize()

  window.addEventListener('resize', () => {
    handleResize()
    update()
  })

  let mesh: Mesh | undefined

  async function update() {
    if (mesh) {
      scene.remove(mesh)
    }

    const geometry = await textRenderer.createTextGeometry(textEditor.text, {
      fontFace: textEditor.font,
      fontSize: textEditor.fontSize,
      lang: 'en',
      direction: textEditor.textDirection,
      align: textEditor.textAlign,
      letterSpacing: textEditor.letterSpacing,
      maxWidth: textEditor.maxWidth,
      maxHeight: textEditor.maxHeight
    })

    const { maxWidth, maxHeight } = textEditor

    mesh = new Mesh(
      geometry,
      new MeshBasicMaterial({
        color: 0xff0000,
        side: DoubleSide
      })
    )

    scene.add(mesh)

    const { boundingBox } = geometry
    const boundingMesh = new Mesh(
      new PlaneBufferGeometry(maxWidth, maxHeight),
      new MeshBasicMaterial({
        color: 0xffffff,
        side: DoubleSide
      })
    )
    boundingMesh.position.z -= 0.1
    mesh.add(boundingMesh)
    //const box = new Box3Helper(boundingBox, new Color(0x0000ff))
    //mesh.add(box)

    const width = Math.abs(boundingBox.min.x - boundingBox.max.x)
    //const height = Math.abs(boundingBox.min.y - boundingBox.max.y)

    geometry.translate(-maxWidth / 2, -maxHeight / 2 + textEditor.fontSize, 0)

    // mesh.position.x = maxWidth / 2 + maxWidth - width
    // mesh.position.y = maxHeight / 2

    //mesh.position.x += width / 2

    rulerHorizontal.render(maxWidth)
    rulerVertical.render(maxHeight)
  }

  update()

  const rotation = new Vector3()

  let frameCount = 0
  const loop = () => {
    if (mesh) {
      rotation.y = Math.sin(frameCount / 100)
      rotation.x = Math.sin(frameCount / 400)

      //mesh.rotation.setFromVector3(rotation)
    }

    renderer.render(scene, camera)

    frameCount++
    requestAnimationFrame(loop)
  }

  requestAnimationFrame(loop)
}

main()
