
// components/bars.jsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';


function Bar({ isActive, isPassed }) {

  
  const widthAnim = useRef(new Animated.Value(70)).current;

  
  const opacityAnim = useRef(new Animated.Value(isPassed ? 1 : 0)).current;

  useEffect(() => {

    
    Animated.parallel([

      Animated.timing(widthAnim, {
        toValue: isActive ? 90 : 70,   
        duration: 300,                  
        useNativeDriver: false,        
      }),

      
      Animated.timing(opacityAnim, {
        toValue: isActive || isPassed ? 1 : 0.4,
        duration: 300,
        useNativeDriver: false,         
      }),

    ]).start(); 

  }, [isActive, isPassed]); 

 
  const backgroundColor = isActive
    ? '#006D37'   // dark green → current page
    : isPassed
    ? '#2ECC71'   // light green → passed page
    : '#DBE5DE';  

  
  return (
    <Animated.View
      style={[
        styles.bar,
        {
          width: widthAnim,           
          opacity: opacityAnim,       
          backgroundColor,            
        },
      ]}
    />
  );
}


export default function Bars({ style, currentPage = 0, totalPages = 4 }) {
  return (
    <View style={[styles.barsContainer, style]}>
      {Array.from({ length: totalPages }).map((_, i) => (
        <Bar
          key={i}
          isActive={i === currentPage}   
          isPassed={i < currentPage}     
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  barsContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center', 
  },
    bar: {
    height: 4.7,
    borderRadius: 3,
  },
});

