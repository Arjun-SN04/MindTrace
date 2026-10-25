import { RigidBody } from '@react-three/rapier';
import { Atmosphere } from './Atmosphere';
import { CafeAlley } from './CafeAlley';
import { Door } from './Door';
import { Halvorsen } from './Halvorsen';
import { FLOOR_Y } from './layout';
import { Street } from './Street';

/** The Old Town slice. All static colliders live in one fixed rigid body. */
export function World() {
  return (
    <>
      <Atmosphere />
      <RigidBody type="fixed" colliders={false}>
        <Street />
        <Halvorsen />
        <CafeAlley />
      </RigidBody>
      <Door hinge={[-1.0, FLOOR_Y, 11.4]} width={1.2} height={2.3} openAngle={-Math.PI * 0.48} flag="door_1c_open" />
    </>
  );
}
