import { StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

export const GlobalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.dark,
  },
  card: {
    backgroundColor: COLORS.background.darker,
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
  },
  title: {
    color: COLORS.text.light,
    fontSize: 18,
    fontWeight: 'bold',
  },
  text: {
    color: COLORS.text.light,
  },
  price: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.text.dark,
    fontWeight: 'bold',
  },
  discountTag: {
    backgroundColor: COLORS.discount,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
});