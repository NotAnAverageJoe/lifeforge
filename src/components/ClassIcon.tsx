import React from 'react';
import type { SvgProps } from 'react-native-svg';
import { GOLD } from '../theme';

import WarriorSvg from '../../Images/classes/warrior.svg';
import RogueSvg from '../../Images/classes/rogue.svg';
import MageSvg from '../../Images/classes/mage.svg';
import ClericSvg from '../../Images/classes/cleric.svg';
import RangerSvg from '../../Images/classes/ranger.svg';
import BardSvg from '../../Images/classes/bard.svg';

const CLASS_SVG: Record<string, React.FC<SvgProps>> = {
  warrior: WarriorSvg,
  rogue: RogueSvg,
  mage: MageSvg,
  cleric: ClericSvg,
  ranger: RangerSvg,
  bard: BardSvg,
};

type Props = SvgProps & { classId: string; color?: string };

export default function ClassIcon({ classId, color = GOLD, width = 24, height = 24, ...rest }: Props) {
  const Icon = CLASS_SVG[classId];
  if (!Icon) return null;
  return <Icon fill={color} width={width} height={height} {...rest} />;
}
