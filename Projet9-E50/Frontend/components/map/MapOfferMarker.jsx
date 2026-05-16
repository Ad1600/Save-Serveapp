import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Marker } from 'react-native-maps';
import { Colors } from '../../constants/Color';

export const MapOfferMarker = React.memo(({ offer, onPress }) => {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  const numericPrice = Number(offer?.price ?? offer?.prix ?? 0);
  const coords = offer.coordinates;

  if (!coords || (coords.latitude === 0 && coords.longitude === 0)) return null;

  return (
    <Marker
      coordinate={coords}
      onPress={onPress}
      tracksViewChanges={tracksViewChanges}
      anchor={{ x: 0.5, y: 1 }}
      calloutEnabled={false}
    >
      <View
        style={styles.wrapper}
        collapsable={false}
        onLayout={() => setTracksViewChanges(false)}
      >
        <View style={styles.priceBadge}>
          <Text style={styles.priceText}>{Math.round(numericPrice)} DA</Text>
        </View>
        <View style={styles.arrowWrapper}>
          <View style={styles.arrow} />
        </View>
      </View>
    </Marker>
  );
}, (prev, next) =>
  prev.offer._id === next.offer._id &&
  prev.offer.prix === next.offer.prix &&
  prev.offer.coordinates?.latitude === next.offer.coordinates?.latitude &&
  prev.offer.coordinates?.longitude === next.offer.coordinates?.longitude
);

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    flexDirection: 'column',
    // Android needs explicit sizing to avoid clipping
    ...Platform.select({
      android: { minWidth: 70, minHeight: 40 },
    }),
  },
  priceBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  priceText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 11,
  },
  // Wrap arrow in a fixed-size container so Android doesn't clip it
  arrowWrapper: {
    width: 12,
    height: 8,
    alignItems: 'center',
    overflow: 'visible',
  },
  arrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.primary,
  },
});