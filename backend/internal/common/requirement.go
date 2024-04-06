package common

type Requirement string

const (
	Required    Requirement = "required"
	NotRequired Requirement = "not-required"
	Optional    Requirement = "optional"
)

func (r Requirement) IsEnabled() bool {
	return r == Required || r == Optional
}

func (r Requirement) IsRequired() bool {
	return r == Required
}

func (r Requirement) IsOptional() bool {
	return r == Optional
}

func (r Requirement) IsNotRequired() bool {
	return r == NotRequired
}
