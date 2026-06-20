import { useEffect, useRef } from 'react'
import { makeObservable, reaction, computed, type IReactionDisposer, observable, action } from 'mobx'

interface StepAnimation {
  notPast(step: number): boolean
}

class MyStepAnimation implements StepAnimation {

  _step: number = -1
  _reactionDisposer: IReactionDisposer | undefined = undefined

  _initialStep: () => boolean
  _intervals: number[]

    /**  initialStep: false -> true: step 0
                      true -> false: step 1
         after intervals[0] : step 2
         after intervals[1] : step 3

        initialStep must contain at least one mobx observable and return boolean 
        see: https://mobx.js.org/reactions.html#reaction
    */
  constructor(initialStep: () => boolean, intervals: number[]) {

    this._initialStep = initialStep
    this._intervals = intervals

    makeObservable(this, {
      _step: observable,
      _setStep: action
    })
  }

    // This is separated out because reactions have to be created
    // once we have a valid doc / window etc. (mobx internals)
    // Can't just do it in constructor and assign to ref
  initialize = () => {
    
    const fireNext = () => {
      this._setStep(this._step + 1)
      if (this._step <= this._intervals.length) {
          // No need to call clearTimeout(): https://stackoverflow.com/a/7391588/11645689
        setTimeout(() => { fireNext() }, this._intervals[this._step - 1]) 
      }
    }

    this._reactionDisposer = reaction(
      this._initialStep,
      (triggered: boolean) => {
        if (triggered && this._step === -1) { 
          this._setStep(0)
        }
          // extra safe
        else if (this._step === 0) { 
          fireNext()  
        }
      }
    )
  }

  _setStep = (v: number): void => {this._step = v}

  dispose = () => {
    if (this._reactionDisposer) {
      this._reactionDisposer()
    }
  }

    // https://mobx.js.org/computeds-with-args.html#2-close-over-the-arguments
  notPast = (step: number): boolean => (
    computed(() => (this._step > -1 && this._step <= step)).get()
  )
}

const useStepAnimation = (initialStep: () => boolean, intervals: number[]): StepAnimation => {

  const animRef = useRef<MyStepAnimation>(new MyStepAnimation(initialStep, intervals))
  useEffect(() => {
    animRef.current.initialize()
    return animRef.current.dispose 
  }, [])

  return animRef.current
}

export {
  type StepAnimation, 
  useStepAnimation
}