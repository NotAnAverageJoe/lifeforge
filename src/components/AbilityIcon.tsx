import React from 'react';
import type { SvgProps } from 'react-native-svg';
import type { AbilityScores } from '../types';

import StrengthSvg from '../../Images/strength.svg';
import DexteritySvg from '../../Images/dexterity.svg';
import ConstitutionSvg from '../../Images/constitution.svg';
import IntelligenceSvg from '../../Images/intelligence.svg';
import WisdomSvg from '../../Images/wisdom.svg';
import CharismaSvg from '../../Images/charisma.svg';

const ABILITY_SVG: Record<keyof AbilityScores, React.FC<SvgProps>> = {
  strength: StrengthSvg,
  dexterity: DexteritySvg,
  constitution: ConstitutionSvg,
  intelligence: IntelligenceSvg,
  wisdom: WisdomSvg,
  charisma: CharismaSvg,
};

type Props = SvgProps & { ability: keyof AbilityScores };

export default function AbilityIcon({ ability, width = 24, height = 24, ...rest }: Props) {
  const Icon = ABILITY_SVG[ability];
  return <Icon width={width} height={height} {...rest} />;
}
