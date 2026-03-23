const DEFAULT_NATURAL_FREQUENCY = 12
const DEFAULT_DAMPING_RATIO = 0.75

export class SpringEaser {
  velocity: number
  private _dampingRatio: number
  private _naturalFrequency: number
  private _dampedFrequency: number

  constructor(initialVelocity: number, dampingRatio?: number, naturalFrequency?: number) {
    this.velocity = initialVelocity * 1000
    this._dampingRatio = dampingRatio ?? DEFAULT_DAMPING_RATIO
    this._naturalFrequency = naturalFrequency ?? DEFAULT_NATURAL_FREQUENCY
    this._dampedFrequency = this._naturalFrequency

    if (this._dampingRatio < 1) {
      this._dampedFrequency *= Math.sqrt(1 - this._dampingRatio * this._dampingRatio)
    }
  }

  easeFrame(deltaPosition: number, deltaTime: number): number {
    let displacement = 0
    let coeff: number

    deltaTime /= 1000

    const naturalDampingPow = Math.E ** (-this._dampingRatio * this._naturalFrequency * deltaTime)

    if (this._dampingRatio === 1) {
      coeff = this.velocity + this._naturalFrequency * deltaPosition
      displacement = (deltaPosition + coeff * deltaTime) * naturalDampingPow
      this.velocity
        = displacement * -this._naturalFrequency + coeff * naturalDampingPow
    }
    else if (this._dampingRatio < 1) {
      coeff
        = (1 / this._dampedFrequency)
          * (this._dampingRatio * this._naturalFrequency * deltaPosition + this.velocity)

      const dampedFCos = Math.cos(this._dampedFrequency * deltaTime)
      const dampedFSin = Math.sin(this._dampedFrequency * deltaTime)

      displacement = naturalDampingPow * (deltaPosition * dampedFCos + coeff * dampedFSin)

      this.velocity
        = displacement * -this._naturalFrequency * this._dampingRatio
          + naturalDampingPow
          * (-this._dampedFrequency * deltaPosition * dampedFSin
            + this._dampedFrequency * coeff * dampedFCos)
    }

    return displacement
  }
}
