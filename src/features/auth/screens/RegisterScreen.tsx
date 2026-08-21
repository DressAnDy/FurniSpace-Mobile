import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  eyeIconDefinition,
  eyeOffIconDefinition,
  lockIconDefinition,
  mailIconDefinition,
  userIconDefinition,
} from "../../../icons/auth/definitions";
import { phoneIconDefinition } from "../../../icons/communication/definitions";
import type { RootStackParamList } from "../../../app/navigation/RootNavigator";
import { AppIcon } from "../../../shared/components/AppIcon";
import { getErrorMessage } from "../../../core/errors/getErrorMessage";
import { ScreenContainer } from "../../../shared/components/ScreenContainer";
import { FlashableInputWrap } from "../components/FlashableInputWrap";
import { useRegisterAction } from "../hooks/useAuthActions";
import {
  isRegisterFormValid,
  RegisterFormErrors,
  validateEmail,
  validateFullName,
  validatePassword,
  validatePhone,
  validateRegisterForm,
} from "../utils/auth.validation";
import { styles } from "./RegisterScreen.styles";

const brandLogo = require("../../../../assets/brand/furnispace-logo.png");

type FieldKey = keyof RegisterFormErrors;

export function RegisterScreen(): React.JSX.Element {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const registerMutation = useRegisterAction();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [flashToken, setFlashToken] = useState(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const formValues = useMemo(
    () => ({ fullName, email, phone, password }),
    [email, fullName, password, phone],
  );

  const isFormValid = useMemo(() => isRegisterFormValid(formValues), [formValues]);
  const disabled = registerMutation.isPending;
  const showLiveErrors = hasSubmitted;

  const markTouched = (field: FieldKey) => {
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const setFieldError = (field: FieldKey, message: string | null) => {
    setErrors((current) => {
      if (!message) {
        if (!current[field]) {
          return current;
        }
        const next = { ...current };
        delete next[field];
        return next;
      }
      return { ...current, [field]: message };
    });
  };

  const shouldValidateField = (field: FieldKey) => Boolean(touched[field] || showLiveErrors);

  const handleFullNameChange = (value: string) => {
    setFullName(value);
    if (shouldValidateField("fullName")) {
      setFieldError("fullName", validateFullName(value));
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (shouldValidateField("email")) {
      setFieldError("email", validateEmail(value));
    }
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    if (shouldValidateField("phone")) {
      setFieldError("phone", validatePhone(value));
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (shouldValidateField("password")) {
      setFieldError("password", validatePassword(value));
    }
  };

  const handleRegister = () => {
    const nextErrors = validateRegisterForm(formValues);
    setErrors(nextErrors);
    setTouched({ fullName: true, email: true, phone: true, password: true });
    setHasSubmitted(true);

    if (Object.keys(nextErrors).length > 0) {
      setFlashToken((token) => token + 1);
      return;
    }

    registerMutation.mutate(
      {
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
      },
      {
        onSuccess: () => {
          Alert.alert("Success", "Account created. Please verify OTP sent to your email.");
          navigation.navigate("VerifyEmail", { email: email.trim() });
        },
        onError: (error) => {
          Alert.alert("Register failed", getErrorMessage(error, "Unable to register."));
        },
      },
    );
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
        style={styles.screen}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroSection}>
            <View style={styles.heroDecorLarge} />
            <View style={styles.heroDecorSmall} />
            <View style={styles.heroContent}>
              <View style={styles.heroLogoFrame}>
                <Image source={brandLogo} style={styles.heroLogo} resizeMode="cover" />
              </View>
              <Text style={styles.heroTagline}>JOIN AS CUSTOMER</Text>
            </View>
            <View style={styles.heroCurve} />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>Register to track your interior project and verify email with OTP.</Text>

            <View style={styles.fieldSection}>
              <Text style={styles.label}>FULL NAME</Text>
              <FlashableInputWrap hasError={Boolean(errors.fullName)} flashToken={errors.fullName ? flashToken : 0}>
                <AppIcon definition={userIconDefinition} size={15} color="#9B8F86" />
                <TextInput
                  autoCapitalize="words"
                  autoCorrect={false}
                  placeholder="Nguyen Van A"
                  placeholderTextColor="rgba(122,111,104,0.5)"
                  style={styles.input}
                  value={fullName}
                  onBlur={() => {
                    markTouched("fullName");
                    setFieldError("fullName", validateFullName(fullName));
                  }}
                  onChangeText={handleFullNameChange}
                />
              </FlashableInputWrap>
              {errors.fullName ? <Text style={styles.fieldError}>{errors.fullName}</Text> : null}
            </View>

            <View style={styles.fieldSection}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <FlashableInputWrap hasError={Boolean(errors.email)} flashToken={errors.email ? flashToken : 0}>
                <AppIcon definition={mailIconDefinition} size={15} color="#9B8F86" />
                <TextInput
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  keyboardType="email-address"
                  placeholder="customer@example.com"
                  placeholderTextColor="rgba(122,111,104,0.5)"
                  style={styles.input}
                  textContentType="emailAddress"
                  value={email}
                  onBlur={() => {
                    markTouched("email");
                    setFieldError("email", validateEmail(email));
                  }}
                  onChangeText={handleEmailChange}
                />
              </FlashableInputWrap>
              {errors.email ? <Text style={styles.fieldError}>{errors.email}</Text> : null}
            </View>

            <View style={styles.fieldSection}>
              <Text style={styles.label}>PHONE (OPTIONAL)</Text>
              <FlashableInputWrap hasError={Boolean(errors.phone)} flashToken={errors.phone ? flashToken : 0}>
                <AppIcon definition={phoneIconDefinition} size={15} color="#9B8F86" />
                <TextInput
                  autoCapitalize="none"
                  autoComplete="tel"
                  autoCorrect={false}
                  keyboardType="phone-pad"
                  placeholder="+84901234567"
                  placeholderTextColor="rgba(122,111,104,0.5)"
                  style={styles.input}
                  textContentType="telephoneNumber"
                  value={phone}
                  onBlur={() => {
                    markTouched("phone");
                    setFieldError("phone", validatePhone(phone));
                  }}
                  onChangeText={handlePhoneChange}
                />
              </FlashableInputWrap>
              {errors.phone ? <Text style={styles.fieldError}>{errors.phone}</Text> : null}
            </View>

            <View style={styles.fieldSection}>
              <Text style={styles.label}>PASSWORD</Text>
              <FlashableInputWrap hasError={Boolean(errors.password)} flashToken={errors.password ? flashToken : 0}>
                <AppIcon definition={lockIconDefinition} size={15} color="#9B8F86" />
                <TextInput
                  autoCapitalize="none"
                  autoComplete="password-new"
                  autoCorrect={false}
                  importantForAutofill="no"
                  placeholder="••••••••"
                  placeholderTextColor="rgba(122,111,104,0.5)"
                  secureTextEntry={!isPasswordVisible}
                  spellCheck={false}
                  style={styles.input}
                  textContentType="newPassword"
                  value={password}
                  onBlur={() => {
                    markTouched("password");
                    setFieldError("password", validatePassword(password));
                  }}
                  onChangeText={handlePasswordChange}
                />
                <Pressable hitSlop={8} onPress={() => setIsPasswordVisible((prev) => !prev)}>
                  <AppIcon
                    definition={isPasswordVisible ? eyeOffIconDefinition : eyeIconDefinition}
                    size={15}
                    color="#9B8F86"
                  />
                </Pressable>
              </FlashableInputWrap>
              {errors.password ? (
                <Text style={styles.fieldError}>{errors.password}</Text>
              ) : (
                <Text style={styles.passwordHint}>8–128 chars, uppercase, lowercase, and number required.</Text>
              )}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.button,
                (disabled || !isFormValid) && styles.buttonDisabled,
                pressed && !disabled && styles.buttonPressed,
              ]}
              disabled={disabled}
              onPress={handleRegister}
            >
              <Text style={styles.buttonText}>{registerMutation.isPending ? "Creating..." : "Create account"}</Text>
            </Pressable>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Pressable onPress={() => navigation.navigate("Login")} hitSlop={8}>
                <Text style={styles.footerLink}>Sign in</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
