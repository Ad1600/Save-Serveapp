// components/SaveServe.js
import React from 'react';
import { View, Text } from 'react-native';
import GradientText from './Gradient'; // your existing component
import { useFonts, Quicksand_500Medium } from '@expo-google-fonts/quicksand';

export default function SaveServe({ 
  radius = 320, 
  arcSpan = 41, 
  fontSize = 42,
  saveColors = ['#FF8C00', '#F36523'],  // ← change gradient colors here
}) {
  const [fontsLoaded] = useFonts({ Quicksand_500Medium });
  if (!fontsLoaded) return null;

  const chars = [
    { char: 'S', gradient: true,  w: 0.72 },
    { char: 'a', gradient: true,  w: 0.68 },
    { char: 'v', gradient: true,  w: 0.68 },
    { char: 'e', gradient: true,  w: 0.68 },
    { char: '&', gradient: false, color: '#5BA224', w: 0.82 },
    { char: 'S', gradient: false, color: '#5BA224', w: 0.72 },
    { char: 'e', gradient: false, color: '#5BA224', w: 0.68 },
    { char: 'r', gradient: false, color: '#5BA224', w: 0.52 },
    { char: 'v', gradient: false, color: '#5BA224', w: 0.68 },
    { char: 'e', gradient: false, color: '#5BA224', w: 0.68 },
  ];

  const charWidths = chars.map(c => c.w * fontSize);
  const totalWidth = charWidths.reduce((s, w) => s + w, 0);
  const maxAngleRad = (arcSpan / 2) * (Math.PI / 180);
  const charBoxSize = fontSize * 1.5;
  const canvasWidth = radius * 2 * Math.sin(maxAngleRad) + charBoxSize;
  const canvasHeight = radius * (1 - Math.cos(maxAngleRad)) + charBoxSize;
  const cx = canvasWidth / 2;
  const cy = charBoxSize / 2 - radius * Math.cos(maxAngleRad);

  let accumulated = 0;
  const positions = charWidths.map((w) => {
    const center = accumulated + w / 2;
    accumulated += w;
    return center;
  });

  const textStyle = {
    fontSize,
    fontFamily: 'Quicksand_500Medium',
    textAlign: 'center',
  };

  return (
    <View style={{ width: canvasWidth, height: canvasHeight, alignSelf: 'center' }}>
      {chars.map((item, index) => {
        const progress = positions[index] / totalWidth - 0.5;
        const angleDeg = progress * arcSpan;
        const angleRad = angleDeg * (Math.PI / 180);
        const x = cx + radius * Math.sin(angleRad);
        const y = cy + radius * Math.cos(angleRad);

        return (
          <View
            key={`char-${index}`}
            style={{
              position: 'absolute',
              left: x - charBoxSize / 2,
              top: y - charBoxSize / 2,
              width: charBoxSize,
              height: charBoxSize,
              justifyContent: 'center',
              alignItems: 'center',
              transform: [{ rotate: `${-angleDeg}deg` }],
            }}
          >
            {item.gradient ? (
              <GradientText
                text={item.char}
                colors={saveColors}   // ← uses the prop you pass in
                style={textStyle}
              />
            ) : (
              <Text numberOfLines={1} style={[textStyle, { color: item.color }]}>
                {item.char}
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}