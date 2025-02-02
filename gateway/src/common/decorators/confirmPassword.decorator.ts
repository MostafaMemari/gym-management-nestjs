import { registerDecorator, ValidationArguments } from "class-validator";
import { SignupDto } from "../dtos/auth.dto";

interface ValidateArguments extends ValidationArguments {
    object: SignupDto;
}

export function ConfirmPassword() {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName,
            validator: {
                defaultMessage() {
                    return "ConfirmPassword is not equal to password";
                },
                validate(value: string, validationArguments: ValidateArguments) {
                    return value == validationArguments?.object.password;
                },
            },
        });
    };
}