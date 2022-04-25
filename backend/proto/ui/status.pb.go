// Code generated by protoc-gen-go. DO NOT EDIT.
// versions:
// 	protoc-gen-go v1.28.0
// 	protoc        v3.11.4
// source: ui/status.proto

package ui

import (
	protoreflect "google.golang.org/protobuf/reflect/protoreflect"
	protoimpl "google.golang.org/protobuf/runtime/protoimpl"
	reflect "reflect"
	sync "sync"
)

const (
	// Verify that this generated code is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(20 - protoimpl.MinVersion)
	// Verify that runtime/protoimpl is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(protoimpl.MaxVersion - 20)
)

type GetStatusRequest struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields
}

func (x *GetStatusRequest) Reset() {
	*x = GetStatusRequest{}
	if protoimpl.UnsafeEnabled {
		mi := &file_ui_status_proto_msgTypes[0]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *GetStatusRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*GetStatusRequest) ProtoMessage() {}

func (x *GetStatusRequest) ProtoReflect() protoreflect.Message {
	mi := &file_ui_status_proto_msgTypes[0]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use GetStatusRequest.ProtoReflect.Descriptor instead.
func (*GetStatusRequest) Descriptor() ([]byte, []int) {
	return file_ui_status_proto_rawDescGZIP(), []int{0}
}

type GetStatusResponse struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Nodes    []*NodeStatus        `protobuf:"bytes,1,rep,name=nodes,proto3" json:"nodes,omitempty"`
	Versions []*DeployedComponent `protobuf:"bytes,2,rep,name=versions,proto3" json:"versions,omitempty"`
	Flows    *FlowStats           `protobuf:"bytes,3,opt,name=flows,proto3" json:"flows,omitempty"`
}

func (x *GetStatusResponse) Reset() {
	*x = GetStatusResponse{}
	if protoimpl.UnsafeEnabled {
		mi := &file_ui_status_proto_msgTypes[1]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *GetStatusResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*GetStatusResponse) ProtoMessage() {}

func (x *GetStatusResponse) ProtoReflect() protoreflect.Message {
	mi := &file_ui_status_proto_msgTypes[1]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use GetStatusResponse.ProtoReflect.Descriptor instead.
func (*GetStatusResponse) Descriptor() ([]byte, []int) {
	return file_ui_status_proto_rawDescGZIP(), []int{1}
}

func (x *GetStatusResponse) GetNodes() []*NodeStatus {
	if x != nil {
		return x.Nodes
	}
	return nil
}

func (x *GetStatusResponse) GetVersions() []*DeployedComponent {
	if x != nil {
		return x.Versions
	}
	return nil
}

func (x *GetStatusResponse) GetFlows() *FlowStats {
	if x != nil {
		return x.Flows
	}
	return nil
}

type NodeStatus struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Name        string `protobuf:"bytes,1,opt,name=name,proto3" json:"name,omitempty"`
	IsAvailable bool   `protobuf:"varint,2,opt,name=is_available,json=isAvailable,proto3" json:"is_available,omitempty"`
}

func (x *NodeStatus) Reset() {
	*x = NodeStatus{}
	if protoimpl.UnsafeEnabled {
		mi := &file_ui_status_proto_msgTypes[2]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *NodeStatus) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*NodeStatus) ProtoMessage() {}

func (x *NodeStatus) ProtoReflect() protoreflect.Message {
	mi := &file_ui_status_proto_msgTypes[2]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use NodeStatus.ProtoReflect.Descriptor instead.
func (*NodeStatus) Descriptor() ([]byte, []int) {
	return file_ui_status_proto_rawDescGZIP(), []int{2}
}

func (x *NodeStatus) GetName() string {
	if x != nil {
		return x.Name
	}
	return ""
}

func (x *NodeStatus) GetIsAvailable() bool {
	if x != nil {
		return x.IsAvailable
	}
	return false
}

type DeployedComponent struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	Name    string `protobuf:"bytes,1,opt,name=name,proto3" json:"name,omitempty"`
	Version string `protobuf:"bytes,2,opt,name=version,proto3" json:"version,omitempty"`
}

func (x *DeployedComponent) Reset() {
	*x = DeployedComponent{}
	if protoimpl.UnsafeEnabled {
		mi := &file_ui_status_proto_msgTypes[3]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *DeployedComponent) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*DeployedComponent) ProtoMessage() {}

func (x *DeployedComponent) ProtoReflect() protoreflect.Message {
	mi := &file_ui_status_proto_msgTypes[3]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use DeployedComponent.ProtoReflect.Descriptor instead.
func (*DeployedComponent) Descriptor() ([]byte, []int) {
	return file_ui_status_proto_rawDescGZIP(), []int{3}
}

func (x *DeployedComponent) GetName() string {
	if x != nil {
		return x.Name
	}
	return ""
}

func (x *DeployedComponent) GetVersion() string {
	if x != nil {
		return x.Version
	}
	return ""
}

type FlowStats struct {
	state         protoimpl.MessageState
	sizeCache     protoimpl.SizeCache
	unknownFields protoimpl.UnknownFields

	PerSecond float32 `protobuf:"fixed32,1,opt,name=per_second,json=perSecond,proto3" json:"per_second,omitempty"`
}

func (x *FlowStats) Reset() {
	*x = FlowStats{}
	if protoimpl.UnsafeEnabled {
		mi := &file_ui_status_proto_msgTypes[4]
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		ms.StoreMessageInfo(mi)
	}
}

func (x *FlowStats) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*FlowStats) ProtoMessage() {}

func (x *FlowStats) ProtoReflect() protoreflect.Message {
	mi := &file_ui_status_proto_msgTypes[4]
	if protoimpl.UnsafeEnabled && x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use FlowStats.ProtoReflect.Descriptor instead.
func (*FlowStats) Descriptor() ([]byte, []int) {
	return file_ui_status_proto_rawDescGZIP(), []int{4}
}

func (x *FlowStats) GetPerSecond() float32 {
	if x != nil {
		return x.PerSecond
	}
	return 0
}

var File_ui_status_proto protoreflect.FileDescriptor

var file_ui_status_proto_rawDesc = []byte{
	0x0a, 0x0f, 0x75, 0x69, 0x2f, 0x73, 0x74, 0x61, 0x74, 0x75, 0x73, 0x2e, 0x70, 0x72, 0x6f, 0x74,
	0x6f, 0x12, 0x02, 0x75, 0x69, 0x22, 0x12, 0x0a, 0x10, 0x47, 0x65, 0x74, 0x53, 0x74, 0x61, 0x74,
	0x75, 0x73, 0x52, 0x65, 0x71, 0x75, 0x65, 0x73, 0x74, 0x22, 0x91, 0x01, 0x0a, 0x11, 0x47, 0x65,
	0x74, 0x53, 0x74, 0x61, 0x74, 0x75, 0x73, 0x52, 0x65, 0x73, 0x70, 0x6f, 0x6e, 0x73, 0x65, 0x12,
	0x24, 0x0a, 0x05, 0x6e, 0x6f, 0x64, 0x65, 0x73, 0x18, 0x01, 0x20, 0x03, 0x28, 0x0b, 0x32, 0x0e,
	0x2e, 0x75, 0x69, 0x2e, 0x4e, 0x6f, 0x64, 0x65, 0x53, 0x74, 0x61, 0x74, 0x75, 0x73, 0x52, 0x05,
	0x6e, 0x6f, 0x64, 0x65, 0x73, 0x12, 0x31, 0x0a, 0x08, 0x76, 0x65, 0x72, 0x73, 0x69, 0x6f, 0x6e,
	0x73, 0x18, 0x02, 0x20, 0x03, 0x28, 0x0b, 0x32, 0x15, 0x2e, 0x75, 0x69, 0x2e, 0x44, 0x65, 0x70,
	0x6c, 0x6f, 0x79, 0x65, 0x64, 0x43, 0x6f, 0x6d, 0x70, 0x6f, 0x6e, 0x65, 0x6e, 0x74, 0x52, 0x08,
	0x76, 0x65, 0x72, 0x73, 0x69, 0x6f, 0x6e, 0x73, 0x12, 0x23, 0x0a, 0x05, 0x66, 0x6c, 0x6f, 0x77,
	0x73, 0x18, 0x03, 0x20, 0x01, 0x28, 0x0b, 0x32, 0x0d, 0x2e, 0x75, 0x69, 0x2e, 0x46, 0x6c, 0x6f,
	0x77, 0x53, 0x74, 0x61, 0x74, 0x73, 0x52, 0x05, 0x66, 0x6c, 0x6f, 0x77, 0x73, 0x22, 0x43, 0x0a,
	0x0a, 0x4e, 0x6f, 0x64, 0x65, 0x53, 0x74, 0x61, 0x74, 0x75, 0x73, 0x12, 0x12, 0x0a, 0x04, 0x6e,
	0x61, 0x6d, 0x65, 0x18, 0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x04, 0x6e, 0x61, 0x6d, 0x65, 0x12,
	0x21, 0x0a, 0x0c, 0x69, 0x73, 0x5f, 0x61, 0x76, 0x61, 0x69, 0x6c, 0x61, 0x62, 0x6c, 0x65, 0x18,
	0x02, 0x20, 0x01, 0x28, 0x08, 0x52, 0x0b, 0x69, 0x73, 0x41, 0x76, 0x61, 0x69, 0x6c, 0x61, 0x62,
	0x6c, 0x65, 0x22, 0x41, 0x0a, 0x11, 0x44, 0x65, 0x70, 0x6c, 0x6f, 0x79, 0x65, 0x64, 0x43, 0x6f,
	0x6d, 0x70, 0x6f, 0x6e, 0x65, 0x6e, 0x74, 0x12, 0x12, 0x0a, 0x04, 0x6e, 0x61, 0x6d, 0x65, 0x18,
	0x01, 0x20, 0x01, 0x28, 0x09, 0x52, 0x04, 0x6e, 0x61, 0x6d, 0x65, 0x12, 0x18, 0x0a, 0x07, 0x76,
	0x65, 0x72, 0x73, 0x69, 0x6f, 0x6e, 0x18, 0x02, 0x20, 0x01, 0x28, 0x09, 0x52, 0x07, 0x76, 0x65,
	0x72, 0x73, 0x69, 0x6f, 0x6e, 0x22, 0x2a, 0x0a, 0x09, 0x46, 0x6c, 0x6f, 0x77, 0x53, 0x74, 0x61,
	0x74, 0x73, 0x12, 0x1d, 0x0a, 0x0a, 0x70, 0x65, 0x72, 0x5f, 0x73, 0x65, 0x63, 0x6f, 0x6e, 0x64,
	0x18, 0x01, 0x20, 0x01, 0x28, 0x02, 0x52, 0x09, 0x70, 0x65, 0x72, 0x53, 0x65, 0x63, 0x6f, 0x6e,
	0x64, 0x62, 0x06, 0x70, 0x72, 0x6f, 0x74, 0x6f, 0x33,
}

var (
	file_ui_status_proto_rawDescOnce sync.Once
	file_ui_status_proto_rawDescData = file_ui_status_proto_rawDesc
)

func file_ui_status_proto_rawDescGZIP() []byte {
	file_ui_status_proto_rawDescOnce.Do(func() {
		file_ui_status_proto_rawDescData = protoimpl.X.CompressGZIP(file_ui_status_proto_rawDescData)
	})
	return file_ui_status_proto_rawDescData
}

var file_ui_status_proto_msgTypes = make([]protoimpl.MessageInfo, 5)
var file_ui_status_proto_goTypes = []interface{}{
	(*GetStatusRequest)(nil),  // 0: ui.GetStatusRequest
	(*GetStatusResponse)(nil), // 1: ui.GetStatusResponse
	(*NodeStatus)(nil),        // 2: ui.NodeStatus
	(*DeployedComponent)(nil), // 3: ui.DeployedComponent
	(*FlowStats)(nil),         // 4: ui.FlowStats
}
var file_ui_status_proto_depIdxs = []int32{
	2, // 0: ui.GetStatusResponse.nodes:type_name -> ui.NodeStatus
	3, // 1: ui.GetStatusResponse.versions:type_name -> ui.DeployedComponent
	4, // 2: ui.GetStatusResponse.flows:type_name -> ui.FlowStats
	3, // [3:3] is the sub-list for method output_type
	3, // [3:3] is the sub-list for method input_type
	3, // [3:3] is the sub-list for extension type_name
	3, // [3:3] is the sub-list for extension extendee
	0, // [0:3] is the sub-list for field type_name
}

func init() { file_ui_status_proto_init() }
func file_ui_status_proto_init() {
	if File_ui_status_proto != nil {
		return
	}
	if !protoimpl.UnsafeEnabled {
		file_ui_status_proto_msgTypes[0].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*GetStatusRequest); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_ui_status_proto_msgTypes[1].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*GetStatusResponse); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_ui_status_proto_msgTypes[2].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*NodeStatus); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_ui_status_proto_msgTypes[3].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*DeployedComponent); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
		file_ui_status_proto_msgTypes[4].Exporter = func(v interface{}, i int) interface{} {
			switch v := v.(*FlowStats); i {
			case 0:
				return &v.state
			case 1:
				return &v.sizeCache
			case 2:
				return &v.unknownFields
			default:
				return nil
			}
		}
	}
	type x struct{}
	out := protoimpl.TypeBuilder{
		File: protoimpl.DescBuilder{
			GoPackagePath: reflect.TypeOf(x{}).PkgPath(),
			RawDescriptor: file_ui_status_proto_rawDesc,
			NumEnums:      0,
			NumMessages:   5,
			NumExtensions: 0,
			NumServices:   0,
		},
		GoTypes:           file_ui_status_proto_goTypes,
		DependencyIndexes: file_ui_status_proto_depIdxs,
		MessageInfos:      file_ui_status_proto_msgTypes,
	}.Build()
	File_ui_status_proto = out.File
	file_ui_status_proto_rawDesc = nil
	file_ui_status_proto_goTypes = nil
	file_ui_status_proto_depIdxs = nil
}
