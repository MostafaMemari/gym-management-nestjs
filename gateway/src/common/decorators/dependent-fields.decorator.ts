import { registerDecorator, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';

@ValidatorConstraint({ name: 'dependentFields', async: false })
export class DependentFieldsConstraint implements ValidatorConstraintInterface {
  validate(value: any, { constraints, object }: ValidationArguments) {
    const relatedField = constraints[0];
    const relatedValue = (object as any)[relatedField];

    return (value == null && relatedValue == null) || (value != null && relatedValue != null);
  }

  defaultMessage({ property, constraints }: ValidationArguments) {
    return `${property} and ${constraints[0]} must both be provided or both be omitted.`;
  }
}

export function IsDependentOn(relatedField: string) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      constraints: [relatedField],
      validator: DependentFieldsConstraint,
    });
  };
}
