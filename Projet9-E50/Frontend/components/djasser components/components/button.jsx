import { Text, StyleSheet, View,Pressable } from 'react-native'
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';
export default function Button(props){

const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_700Bold
  });

  if (!fontsLoaded) {
    return null;
  }



return(
<View>
    
   
<Pressable  {...props} style={({pressed})=> [styles.btn, pressed && styles.pressed]}>
     <Text style={{color :'#F1F0F0',fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18.5 }}>Continue </Text>
</Pressable>



</View>
);



}
const styles = StyleSheet.create({
btn:{
backgroundColor:"#2E7D32",
padding:15,
borderRadius:8.5,
width:320,
height:60,
justifyContent:"center",
alignItems:"center",
bottom:-710  ,
position:"absolute",
alignSelf:"center",
},
pressed:{
    opacity:0.8
}



})