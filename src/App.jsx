import { useEffect, useRef, useState } from 'react'
import './App.css'

function App() {
  const canvasRef = useRef(null)
  const ctxRef = useRef(null)
  const stateRef = useRef(null)
  const stepRef = useRef(null)
  const animationFrameRef = useRef(null)
  const startedRef = useRef(false)
  const [started, setStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctxRef.current = ctx

    const computeBallRadius = (width, height) => Math.max(36, Math.min(width, height) * 0.06)
    const computeFloorHeight = (height) => Math.round(height * 0.25)

    const state = {
      width: window.innerWidth,
      height: window.innerHeight,
      floorHeight: computeFloorHeight(window.innerHeight),
      grounded: false,
      score: 0,
      comboChain: 0,
      popups: [],
      ball: {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        radius: computeBallRadius(window.innerWidth, window.innerHeight),
        vx: 0,
        vy: 0,
      },
      keys: { left: false, right: false },
      enemies: [],
      spawnTimer: 0,
      lastTimestamp: null,
      gameOver: false,
    }
    stateRef.current = state

    const settings = {
      gravity: 0.64,
      moveAccel: 0.6,
      moveFriction: 0.85,
      maxSpeed: 6,
      jumpPower: 16,
      floorColor: '#6cbf4b',
      skyColor: '#6ec5ff',
      ballColor: '#ff66b3',
      enemySpawnMs: 2000,
      stompBounceMultiplier: 0.8,
      enemyTypes: {
        onion: { speed: 3.2, radiusRatio: 1.1, groundLift: 0 },
        pepper: { speed: 7.2, radiusRatio: 1.12, groundLift: 0.08 },
      },
      pepperSpawnChance: 0.35,
      pepperUnlockScore: 500,
    }

    const resetGameState = () => {
      state.grounded = false
      state.keys.left = false
      state.keys.right = false
      state.ball.x = state.width / 2
      state.ball.y = Math.min(state.height / 2, state.height - state.floorHeight - state.ball.radius)
      state.ball.vx = 0
      state.ball.vy = 0
      state.score = 0
      state.comboChain = 0
      state.popups = []
      state.enemies = []
      state.spawnTimer = 0
      state.lastTimestamp = null
      state.gameOver = false
    }

    const spawnEnemy = () => {
      const floorY = state.height - state.floorHeight
      const fromLeft = Math.random() < 0.5
      const direction = fromLeft ? 1 : -1
      const pepperEligible = state.score >= settings.pepperUnlockScore
      const type = pepperEligible && Math.random() < settings.pepperSpawnChance ? 'pepper' : 'onion'
      const spec = settings.enemyTypes[type] ?? settings.enemyTypes.onion
      const radius = state.ball.radius * spec.radiusRatio
      const x = fromLeft ? -radius * 1.2 : state.width + radius * 1.2
      const groundOffset = spec.groundLift * radius
      state.enemies.push({
        type,
        x,
        y: floorY - radius - groundOffset,
        radius,
        vx: spec.speed * direction,
        vy: 0,
        alive: true,
        falling: false,
        groundOffset,
      })
    }

    const drawOnion = (enemy) => {
      const ctx = ctxRef.current
      if (!ctx) return
      ctx.save()
      ctx.translate(enemy.x, enemy.y)

      const r = enemy.radius
      const wobble = enemy.falling ? Math.sin(enemy.y * 0.05) * 0.1 : 0
      ctx.rotate(wobble)

      const bodyWidth = r * 1.3
      const bodyHeight = r * 1.15
      ctx.fillStyle = '#f1e4b3'
      ctx.strokeStyle = '#d2c38f'
      ctx.lineWidth = Math.max(2, r * 0.12)
      ctx.beginPath()
      ctx.ellipse(0, 0, bodyWidth, bodyHeight, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(0, -r * 1.15)
      ctx.quadraticCurveTo(-r * 0.25, -r * 1.6, 0, -r * 1.9)
      ctx.quadraticCurveTo(r * 0.25, -r * 1.6, 0, -r * 1.15)
      ctx.strokeStyle = '#6cbf4b'
      ctx.lineWidth = Math.max(2, r * 0.1)
      ctx.stroke()

      const eyeOffsetX = r * 0.55
      const eyeOffsetY = r * 0.2
      const eyeRadius = Math.max(2.5, r * 0.16)
      ctx.fillStyle = '#1f2937'
      ctx.beginPath()
      ctx.arc(-eyeOffsetX, -eyeOffsetY, eyeRadius, 0, Math.PI * 2)
      ctx.arc(eyeOffsetX, -eyeOffsetY, eyeRadius, 0, Math.PI * 2)
      ctx.fill()

      ctx.beginPath()
      ctx.strokeStyle = '#1f2937'
      ctx.lineWidth = Math.max(2, r * 0.1)
      ctx.arc(0, r * 0.2, r * 0.7, Math.PI * 0.15, Math.PI - Math.PI * 0.15)
      ctx.stroke()

      ctx.restore()
    }

    const drawPepper = (enemy) => {
      const ctx = ctxRef.current
      if (!ctx) return
      ctx.save()
      ctx.translate(enemy.x, enemy.y)

      const r = enemy.radius
      const wobble = enemy.falling ? Math.sin(enemy.y * 0.08) * 0.12 : 0
      ctx.rotate(wobble)

      const bodyWidth = r * 1.7 // much wider, pumpkin-like
      const bodyHeight = r * 1.12 // roughly same height as onion
      const lobe = bodyWidth * 0.22

      ctx.beginPath()
      ctx.moveTo(-bodyWidth * 0.45, -bodyHeight * 0.4)
      ctx.quadraticCurveTo(-bodyWidth * 0.7, -bodyHeight * 0.05, -bodyWidth * 0.45, bodyHeight * 0.75)
      ctx.quadraticCurveTo(-lobe, bodyHeight * 1.05, 0, bodyHeight * 0.75)
      ctx.quadraticCurveTo(lobe, bodyHeight * 1.05, bodyWidth * 0.45, bodyHeight * 0.75)
      ctx.quadraticCurveTo(bodyWidth * 0.7, -bodyHeight * 0.05, bodyWidth * 0.45, -bodyHeight * 0.4)
      ctx.quadraticCurveTo(0, -bodyHeight * 0.85, -bodyWidth * 0.45, -bodyHeight * 0.4)
      ctx.closePath()
      ctx.fillStyle = '#30a14e'
      ctx.strokeStyle = '#1f7a31'
      ctx.lineWidth = Math.max(2, r * 0.12)
      ctx.fill()
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(0, -bodyHeight * 1.05)
      ctx.quadraticCurveTo(-r * 0.15, -bodyHeight * 1.35, 0, -bodyHeight * 1.45)
      ctx.quadraticCurveTo(r * 0.2, -bodyHeight * 1.2, 0, -bodyHeight * 1.05)
      ctx.strokeStyle = '#267238'
      ctx.lineWidth = Math.max(2, r * 0.1)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(-bodyWidth * 0.1, -bodyHeight * 0.55)
      ctx.quadraticCurveTo(-bodyWidth * 0.2, -bodyHeight * 0.25, -bodyWidth * 0.12, 0)
      ctx.moveTo(bodyWidth * 0.1, -bodyHeight * 0.55)
      ctx.quadraticCurveTo(bodyWidth * 0.2, -bodyHeight * 0.25, bodyWidth * 0.12, 0)
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'
      ctx.lineWidth = Math.max(1.2, r * 0.05)
      ctx.stroke()

      const eyeOffsetX = r * 0.5
      const eyeOffsetY = r * 0.15
      const eyeRadius = Math.max(2.5, r * 0.15)
      ctx.fillStyle = '#0f172a'
      ctx.beginPath()
      ctx.arc(-eyeOffsetX, -eyeOffsetY, eyeRadius, 0, Math.PI * 2)
      ctx.arc(eyeOffsetX, -eyeOffsetY, eyeRadius, 0, Math.PI * 2)
      ctx.fill()

      ctx.beginPath()
      ctx.strokeStyle = '#0f172a'
      ctx.lineWidth = Math.max(2, r * 0.1)
      ctx.arc(0, r * 0.2, r * 0.65, Math.PI * 0.15, Math.PI - Math.PI * 0.15)
      ctx.stroke()

      ctx.restore()
    }

    const renderScene = () => {
      const state = stateRef.current
      if (!state || !ctxRef.current) return
      const { ball } = state
      const floorY = state.height - state.floorHeight

      ctxRef.current.fillStyle = settings.skyColor
      ctxRef.current.fillRect(0, 0, state.width, state.height)

      ctxRef.current.fillStyle = settings.floorColor
      ctxRef.current.fillRect(0, floorY, state.width, state.floorHeight)

      state.enemies.forEach((enemy) => {
        if (enemy.type === 'pepper') {
          drawPepper(enemy)
        } else {
          drawOnion(enemy)
        }
      })

      ctxRef.current.beginPath()
      ctxRef.current.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
      ctxRef.current.fillStyle = settings.ballColor
      ctxRef.current.fill()
      ctxRef.current.closePath()

      const eyeOffsetX = ball.radius * 0.4
      const eyeOffsetY = ball.radius * 0.35
      const eyeRadius = Math.max(3, ball.radius * 0.12)
      ctxRef.current.fillStyle = '#1f2937'
      ctxRef.current.beginPath()
      ctxRef.current.arc(ball.x - eyeOffsetX, ball.y - eyeOffsetY, eyeRadius, 0, Math.PI * 2)
      ctxRef.current.arc(ball.x + eyeOffsetX, ball.y - eyeOffsetY, eyeRadius, 0, Math.PI * 2)
      ctxRef.current.fill()
      ctxRef.current.closePath()

      ctxRef.current.beginPath()
      const smileRadius = ball.radius * 0.55
      ctxRef.current.arc(ball.x, ball.y, smileRadius, 0.25 * Math.PI, 0.75 * Math.PI)
      ctxRef.current.strokeStyle = '#1f2937'
      ctxRef.current.lineWidth = Math.max(2, ball.radius * 0.08)
      ctxRef.current.stroke()
      ctxRef.current.closePath()

      ctxRef.current.fillStyle = '#0f172a'
      ctxRef.current.font = '24px Inter, system-ui, -apple-system, sans-serif'
      ctxRef.current.textBaseline = 'top'
      ctxRef.current.fillText(`Score: ${state.score}`, 16, 12)
      ctxRef.current.font = '16px Inter, system-ui, -apple-system, sans-serif'
      ctxRef.current.fillText('Arrows: left/right, Up: jump', 16, 44)

      state.popups.forEach((popup) => {
        const alpha = Math.max(0, popup.remaining / popup.duration)
        ctxRef.current.save()
        ctxRef.current.globalAlpha = alpha
        ctxRef.current.fillStyle = '#f97316'
        ctxRef.current.font = '24px Inter, system-ui, -apple-system, sans-serif'
        ctxRef.current.textAlign = 'center'
        ctxRef.current.textBaseline = 'middle'
        const label = popup.isChain ? `Chain! +${popup.value}` : `+${popup.value}`
        ctxRef.current.fillText(label, popup.x, popup.y)
        ctxRef.current.restore()
      })
    }

    const endGame = () => {
      const state = stateRef.current
      if (!state) return
      state.gameOver = true
      startedRef.current = false
      setStarted(false)
      setGameOver(true)
    }

    const step = () => {
      const state = stateRef.current
      if (!state || state.gameOver) return
      const { ball } = state
      const floorY = state.height - state.floorHeight

      const now = performance.now()
      const last = state.lastTimestamp ?? now
      const deltaMs = Math.min(50, now - last)
      const deltaFactor = deltaMs / 16.67
      state.lastTimestamp = now

      const prevGrounded = state.grounded
      const prevBallY = ball.y

      if (state.keys.left) ball.vx = Math.max(ball.vx - settings.moveAccel * deltaFactor, -settings.maxSpeed)
      if (state.keys.right) ball.vx = Math.min(ball.vx + settings.moveAccel * deltaFactor, settings.maxSpeed)
      if (!state.keys.left && !state.keys.right) {
        ball.vx *= Math.pow(settings.moveFriction, deltaFactor)
      }

      ball.vy += settings.gravity * deltaFactor

      ball.x += ball.vx * deltaFactor
      ball.y += ball.vy * deltaFactor

      ball.x = Math.min(Math.max(ball.x, ball.radius), state.width - ball.radius)

      if (ball.y + ball.radius >= floorY) {
        ball.y = floorY - ball.radius
        ball.vy = 0
        state.grounded = true
      } else {
        state.grounded = false
      }

      if (state.grounded && !prevGrounded) {
        state.comboChain = 0
      }

      state.popups = state.popups
        .map((popup) => ({
          ...popup,
          remaining: popup.remaining - deltaMs,
          y: popup.y - 0.04 * deltaMs,
        }))
        .filter((popup) => popup.remaining > 0)

      state.spawnTimer += deltaMs
      if (state.spawnTimer >= settings.enemySpawnMs) {
        spawnEnemy()
        state.spawnTimer = 0
      }

      state.enemies = state.enemies
        .map((enemy) => {
          if (enemy.alive) {
            enemy.x += enemy.vx * deltaFactor
            const groundOffset = enemy.groundOffset ?? 0
            enemy.y = floorY - enemy.radius - groundOffset
          } else if (enemy.falling) {
            enemy.vy += settings.gravity * deltaFactor
            enemy.y += enemy.vy * deltaFactor
            enemy.x += enemy.vx * deltaFactor * 0.4
          }
          return enemy
        })
        .filter(
          (enemy) =>
            enemy.y - enemy.radius < state.height + 120 &&
            enemy.x + enemy.radius > -160 &&
            enemy.x - enemy.radius < state.width + 160,
        )

      for (const enemy of state.enemies) {
        if (!enemy.alive) continue

        const dx = ball.x - enemy.x
        const dy = ball.y - enemy.y
        const combined = ball.radius + enemy.radius
        const overlapping = dx * dx + dy * dy <= combined * combined

        const onionTop = enemy.y - enemy.radius
        const prevBallBottom = prevBallY + ball.radius
        const ballBottom = ball.y + ball.radius
        const verticalBandDepth = enemy.radius * 0.5 // top quarter of the onion (0.25 * diameter = 0.5r)
        const horizontalLeniency = enemy.radius * 1.05 // allow full width (with tiny tolerance) for corner grazes
        const withinTopLane = Math.abs(dx) <= horizontalLeniency
        const crossesTopBand =
          ball.vy > 0 && prevBallBottom <= onionTop + verticalBandDepth && ballBottom >= onionTop - 2
        const stomped = crossesTopBand && withinTopLane && overlapping

        if (stomped) {
          enemy.alive = false
          enemy.falling = true
          enemy.vy = -settings.jumpPower * 0.25
          enemy.vx *= 0.4
          ball.vy = -settings.jumpPower * settings.stompBounceMultiplier
          state.grounded = false

          const combo = state.comboChain + 1
          const basePoints = enemy.type === 'pepper' ? 200 : 100
          const points = combo * basePoints
          state.comboChain = combo
          state.score += points
          state.popups.push({
            x: enemy.x,
            y: enemy.y - enemy.radius,
            value: points,
            isChain: combo > 1,
            remaining: 900,
            duration: 900,
          })
          continue
        }

        if (overlapping) {
          endGame()
          renderScene()
          return
        }
      }

      renderScene()
      animationFrameRef.current = requestAnimationFrame(step)
    }
    stepRef.current = step

    const resize = () => {
      state.width = window.innerWidth
      state.height = window.innerHeight
      state.floorHeight = computeFloorHeight(state.height)
      state.ball.radius = computeBallRadius(state.width, state.height)
      canvas.width = state.width
      canvas.height = state.height

      const floorY = state.height - state.floorHeight
      if (state.ball.y + state.ball.radius > floorY) {
        state.ball.y = floorY - state.ball.radius
      }
      state.ball.x = Math.min(
        Math.max(state.ball.x, state.ball.radius),
        state.width - state.ball.radius,
      )
      if (!startedRef.current) renderScene()
    }

    const handleKeyDown = (event) => {
      if (!startedRef.current) return
      if (event.key === 'ArrowLeft') state.keys.left = true
      if (event.key === 'ArrowRight') state.keys.right = true
      if (event.key === 'ArrowUp' && state.grounded) {
        state.ball.vy = -settings.jumpPower
        state.grounded = false
      }
    }

    const handleKeyUp = (event) => {
      if (!startedRef.current) return
      if (event.key === 'ArrowLeft') state.keys.left = false
      if (event.key === 'ArrowRight') state.keys.right = false
    }

    window.addEventListener('resize', resize)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    resize()
    renderScene()

    resetGameState()

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      startedRef.current = false
    }
  }, [])

  const startGame = () => {
    if (startedRef.current) return
    const state = stateRef.current
    if (state) {
      const floorY = state.height - state.floorHeight
      state.gameOver = false
      state.spawnTimer = 0
      state.lastTimestamp = null
      state.enemies = []
      state.ball.x = state.width / 2
      state.ball.y = floorY - state.ball.radius
      state.ball.vx = 0
      state.ball.vy = 0
      state.grounded = true
      state.score = 0
      state.comboChain = 0
      state.popups = []
      state.keys.left = false
      state.keys.right = false
    }
    startedRef.current = true
    setStarted(true)
    setGameOver(false)
    if (stepRef.current) {
      animationFrameRef.current = requestAnimationFrame(stepRef.current)
    }
  }

  return (
    <div className="app">
      <canvas ref={canvasRef} className="game-canvas" />
      {!started && (
        <div className="overlay">
          <h1 className="title">Papi Trampoline</h1>
          <p className="subtitle">
            {gameOver ? 'Game over! Try again?' : 'Press play to bounce around'}
          </p>
          <p className="controls">Arrows: left/right · Up: jump</p>
          <button className="play-button" onClick={startGame}>
            {gameOver ? 'Play again' : 'Play'}
          </button>
        </div>
      )}
    </div>
  )
}

export default App
