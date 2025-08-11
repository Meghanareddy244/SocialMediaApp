import React, { useState } from "react";
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

  console.log("5. Component re-rendering with imagePreview:", imagePreview);

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

  const handleSelect = (e) => {
    console.log("1. handleSelect triggered");

    const file = e.target.files[0];
    if (file) {
      console.log("2. File object found:", file);
      setPicture(file);
      // Use FileReader to create a base64 preview
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log("4. FileReader finished. Setting preview.");
        setImagePreview(reader.result);
      };
      reader.onerror = (error) => {
        console.error("FileReader Error:", error);
      }

      // --- DEBUG LOG 3 ---
      console.log("3. FileReader process started");
      reader.readAsDataURL(file);
    }else {
        console.warn("handleSelect triggered, but no file was found.");
    }
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
  <div className="relative w-32 h-32 mx-auto bg-secondary rounded-full flex items-center justify-center">
    {imagePreview ? (
      <img
        src={imagePreview}
        alt="Preview"
        className="w-full h-full object-cover rounded-full"
      />
    ) : (
      <div className="text-ascent-2 text-sm text-center">
        No Image
      </div>
    )}
  </div>

  {/* --- REVISED FILE INPUT AND LABEL --- */}
  
  {/* The actual file input is now separate and hidden */}
  <input
    type="file"
    className="hidden"
    id="imgUpload"
    onChange={(e) => {
      // This is the most important log. If you see this, we've fixed it.
      console.log("✅ --- INPUT ONCHANGE FIRED! --- ✅");
      handleSelect(e);
    }}
    accept="image/*"
  />

  {/* The label is now only for triggering the hidden input */}
  <label
    htmlFor="imgUpload"
    className="flex items-center justify-center gap-2 text-base text-ascent-2 hover:text-ascent-1 cursor-pointer"
  >
    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
      Choose File
    </span>
    <span className="text-ascent-2 text-xs">
      {picture ? picture.name : "No file chosen"}
    </span>
  </label>
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
