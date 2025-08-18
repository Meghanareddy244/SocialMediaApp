import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { MdClose } from "react-icons/md";
import { useSelector, useDispatch } from "react-redux";
import { TextInput, Loading, CustomButton } from "../components";
import { updateProfile, login } from "../redux/userSlice";
import { apiRequest, handleFileUpload } from "../utils";

const EditProfile = () => {
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [errMsg, setErrMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [picture, setPicture] = useState(null);
  const [imagePreview, setImagePreview] = useState(user?.profileUrl ?? "");
  const fileInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: "onChange",
    defaultValues: { ...user },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setErrMsg(" ");
    try {
      const uri = picture ? await handleFileUpload(picture) : user.profileUrl;
      const { firstName, lastName, location, profession } = data;
      const res = await apiRequest({
        url: "/users/update-user",
        data: {
          firstName,
          lastName,
          location,
          profession,
          profileUrl: uri,
        },
        token: user?.token,
        method: "POST",
      });
      if (res?.status === "failed") {
        setErrMsg(res);
      } else {
        setErrMsg(res);
        const newUser = { token: res?.token, ...res?.user };
        dispatch(login(newUser));
        setTimeout(() => {
          dispatch(updateProfile(false));
        }, 3000);
      }
      setIsSubmitting(false);
    } catch (error) {
      console.log(error);
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    dispatch(updateProfile(false));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    console.log("File selected:", file);

    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("File size should be less than 5MB");
        return;
      }

      setPicture(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
      };
      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        alert("Error reading file. Please try again.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChooseFileClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      {/* 1. OVERLAY: Semi-transparent black background. Has a lower z-index. */}
      <div className="fixed inset-0 bg-black/70 z-40"></div>

      {/* 2. MODAL CONTAINER: Sits on top of the overlay. Has a higher z-index. */}
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
        <div className="inline-block align-bottom bg-primary rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Modal Header */}
          <div className="flex justify-between px-6 pt-5 pb-2">
            <label
              htmlFor="name"
              className="block font-medium text-xl text-ascent-1 text-left"
            >
              Edit Profile
            </label>
            <button className="text-ascent-1" onClick={handleClose}>
              <MdClose size={22} />
            </button>
          </div>

          {/* Modal Form */}
          <form
            className="px-4 sm:px-6 flex flex-col gap-3 2xl:gap-6"
            onSubmit={handleSubmit(onSubmit)}
          >
            <TextInput
              styles="w-full"
              label="First Name"
              placeholder="First Name"
              name="firstName"
              register={register("firstName", {
                required: "First Name is required",
              })}
              error={errors.firstName ? errors.firstName.message : ""}
            />
            <TextInput
              styles="w-full"
              label="Last Name"
              placeholder="Last Name"
              name="lastName"
              register={register("lastName", {
                required: "Last Name is required",
              })}
              error={errors.lastName ? errors.lastName.message : ""}
            />
            <TextInput
              styles="w-full"
              label="Profession"
              placeholder="Profession"
              name="profession"
              register={register("profession", {
                required: "Profession is required",
              })}
              error={errors.profession ? errors.profession.message : ""}
            />
            <TextInput
              label="Location"
              styles="w-full"
              placeholder="Location"
              name="location"
              register={register("location", {
                required: "Location is required",
              })}
              error={errors.location ? errors.location.message : ""}
            />

            {/* Image Upload Section */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-ascent-1">
                Profile Picture
              </label>

              {/* Image Preview Container */}
              <div className="relative w-32 h-32 mx-auto bg-secondary rounded-full flex items-center justify-center overflow-hidden">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile Preview"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <div className="text-ascent-2 text-sm text-center">
                    No Image
                  </div>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept="image/*"
              />

              {/* Custom file selection button */}
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={handleChooseFileClick}
                  className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm hover:bg-blue-700 transition-colors"
                >
                  Choose File
                </button>
                {picture && (
                  <span className="text-ascent-2 text-xs text-center">
                    {picture.name}
                  </span>
                )}
              </div>
            </div>

            {errMsg?.message && (
              <span
                className={`text-sm ${
                  errMsg?.status === "failed"
                    ? "text-red-500"
                    : "text-green-500"
                } mt-0.5`}
              >
                {errMsg.message}
              </span>
            )}
            <div className="py-5 sm:flex sm:flex-row-reverse border-t border-[#66666645]">
              {isSubmitting ? (
                <Loading />
              ) : (
                <CustomButton
                  type="submit"
                  containerStyles={`inline-flex justify-center rounded-md px-8 py-3 text-sm font-medium text-white outline-none bg-blue-600`}
                  title="Submit"
                />
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditProfile;